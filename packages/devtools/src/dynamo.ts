import { DynamoDBClient, CreateTableCommand, DescribeTableCommand } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { fromIni } from '@aws-sdk/credential-providers'
import type { RequestRecord, HttpMethod } from './types'

export interface DynamoStorageConfig {
  tableName?: string
  region?: string
  profile?: string
  ttlDays?: number
}

const DEFAULT_TABLE = 'httx-requests'
const DEFAULT_REGION = 'us-east-1'
const DEFAULT_TTL_DAYS = 7

let docClient: DynamoDBDocumentClient | null = null
let rawClient: DynamoDBClient | null = null

function getClients(config: DynamoStorageConfig = {}): { doc: DynamoDBDocumentClient, raw: DynamoDBClient } {
  if (!docClient || !rawClient) {
    const credentials = config.profile ? fromIni({ profile: config.profile }) : undefined
    rawClient = new DynamoDBClient({
      region: config.region ?? DEFAULT_REGION,
      credentials,
    })
    docClient = DynamoDBDocumentClient.from(rawClient, {
      marshallOptions: { removeUndefinedValues: true },
    })
  }
  return { doc: docClient, raw: rawClient }
}

function tableName(config: DynamoStorageConfig = {}): string {
  return config.tableName ?? DEFAULT_TABLE
}

function ttlEpoch(days: number = DEFAULT_TTL_DAYS): number {
  return Math.floor(Date.now() / 1000) + days * 86400
}

// --- Table Management ---

export async function ensureTable(config: DynamoStorageConfig = {}): Promise<void> {
  const { raw } = getClients(config)
  const table = tableName(config)

  try {
    await raw.send(new DescribeTableCommand({ TableName: table }))
    return // table exists
  }
  catch (e: any) {
    if (e.name !== 'ResourceNotFoundException') throw e
  }

  await raw.send(new CreateTableCommand({
    TableName: table,
    KeySchema: [
      { AttributeName: 'pk', KeyType: 'HASH' },
      { AttributeName: 'sk', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'pk', AttributeType: 'S' },
      { AttributeName: 'sk', AttributeType: 'S' },
      { AttributeName: 'gsi1pk', AttributeType: 'S' },
      { AttributeName: 'gsi1sk', AttributeType: 'S' },
      { AttributeName: 'gsi2pk', AttributeType: 'S' },
      { AttributeName: 'gsi2sk', AttributeType: 'S' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'gsi-all-by-time',
        KeySchema: [
          { AttributeName: 'gsi1pk', KeyType: 'HASH' },
          { AttributeName: 'gsi1sk', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
      {
        IndexName: 'gsi-status',
        KeySchema: [
          { AttributeName: 'gsi2pk', KeyType: 'HASH' },
          { AttributeName: 'gsi2sk', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
    BillingMode: 'PAY_PER_REQUEST',
  }))

  // Wait for table to be active
  let active = false
  for (let i = 0; i < 30; i++) {
    const desc = await raw.send(new DescribeTableCommand({ TableName: table }))
    if (desc.Table?.TableStatus === 'ACTIVE') { active = true; break }
    await new Promise(r => setTimeout(r, 2000))
  }
  if (!active) throw new Error(`Table ${table} did not become active`)
}

// --- CRUD ---

function statusBucket(status: number): string {
  if (status < 300) return '2xx'
  if (status < 400) return '3xx'
  if (status < 500) return '4xx'
  return '5xx'
}

export async function putRequest(record: RequestRecord, config: DynamoStorageConfig = {}): Promise<void> {
  const { doc } = getClients(config)
  const table = tableName(config)
  const ttl = ttlEpoch(config.ttlDays)

  await doc.send(new PutCommand({
    TableName: table,
    Item: {
      pk: `HOST#${record.host}`,
      sk: `${record.timestamp}#${record.id}`,
      gsi1pk: 'ALL',
      gsi1sk: `${record.timestamp}#${record.id}`,
      gsi2pk: `STATUS#${statusBucket(record.status)}`,
      gsi2sk: `${record.timestamp}#${record.id}`,
      ttl,
      ...record,
    },
  }))
}

function itemToRecord(item: Record<string, any>): RequestRecord {
  const { pk, sk, gsi1pk, gsi1sk, gsi2pk, gsi2sk, ttl, ...rest } = item
  return rest as RequestRecord
}

export async function queryAllRequests(
  config: DynamoStorageConfig = {},
  opts: { limit?: number, startTime?: string } = {},
): Promise<RequestRecord[]> {
  const { doc } = getClients(config)
  const table = tableName(config)
  const limit = opts.limit ?? 100

  const params: any = {
    TableName: table,
    IndexName: 'gsi-all-by-time',
    KeyConditionExpression: 'gsi1pk = :pk',
    ExpressionAttributeValues: { ':pk': 'ALL' },
    ScanIndexForward: false,
    Limit: limit,
  }

  if (opts.startTime) {
    params.KeyConditionExpression += ' AND gsi1sk >= :st'
    params.ExpressionAttributeValues[':st'] = opts.startTime
  }

  const result = await doc.send(new QueryCommand(params))
  return (result.Items ?? []).map(itemToRecord)
}

export async function queryByHost(
  host: string,
  config: DynamoStorageConfig = {},
  opts: { limit?: number } = {},
): Promise<RequestRecord[]> {
  const { doc } = getClients(config)
  const table = tableName(config)

  const result = await doc.send(new QueryCommand({
    TableName: table,
    KeyConditionExpression: 'pk = :pk',
    ExpressionAttributeValues: { ':pk': `HOST#${host}` },
    ScanIndexForward: false,
    Limit: opts.limit ?? 100,
  }))

  return (result.Items ?? []).map(itemToRecord)
}

export async function queryByStatus(
  bucket: '2xx' | '3xx' | '4xx' | '5xx',
  config: DynamoStorageConfig = {},
  opts: { limit?: number } = {},
): Promise<RequestRecord[]> {
  const { doc } = getClients(config)
  const table = tableName(config)

  const result = await doc.send(new QueryCommand({
    TableName: table,
    IndexName: 'gsi-status',
    KeyConditionExpression: 'gsi2pk = :pk',
    ExpressionAttributeValues: { ':pk': `STATUS#${bucket}` },
    ScanIndexForward: false,
    Limit: opts.limit ?? 100,
  }))

  return (result.Items ?? []).map(itemToRecord)
}

export async function getRequestById(
  id: string,
  config: DynamoStorageConfig = {},
): Promise<RequestRecord | undefined> {
  // Query the GSI to find the record by ID suffix
  const { doc } = getClients(config)
  const table = tableName(config)

  const result = await doc.send(new QueryCommand({
    TableName: table,
    IndexName: 'gsi-all-by-time',
    KeyConditionExpression: 'gsi1pk = :pk',
    FilterExpression: 'id = :id',
    ExpressionAttributeValues: { ':pk': 'ALL', ':id': id },
    Limit: 1,
  }))

  if (result.Items && result.Items.length > 0) {
    return itemToRecord(result.Items[0])
  }
  return undefined
}
