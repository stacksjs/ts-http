import { Buffer } from 'node:buffer'
import process from 'node:process'
import { CLI } from '@stacksjs/clapp'
import { version } from '../package.json'
import { parseCliArgs } from '../src/cli-parser'
import { HttxClient } from '../src/client'
import { config } from '../src/config'

const cli = new CLI('httx')

cli
  .command('[method] [url] [...items]', 'Make an HTTP request')
  .option('-j, --json', 'Send JSON data')
  .option('-f, --form', 'Send form-encoded data')
  .option('-m, --multipart', 'Send multipart form data')
  .option('-d, --download', 'Download mode')
  .option('-F, --follow', 'Follow redirects', { default: true })
  .option('-a, --auth <auth>', 'Authentication (username:password)')
  .option('-t, --timeout <timeout>', 'Request timeout in milliseconds')
  .option('-v, --verbose', 'Enable verbose output')
  .action(async (method, url, items, flags) => {
    try {
      const parsedArgs = parseCliArgs([method, url, ...items].filter(Boolean))

      const client = new HttxClient({
        ...config,
        verbose: flags.verbose,
        timeout: flags.timeout ? Number.parseInt(flags.timeout) : undefined,
      })

      const options = {
        ...parsedArgs.options,
        json: flags.json || parsedArgs.options.json,
        form: flags.form,
        multipart: flags.multipart,
        headers: {
          ...parsedArgs.options.headers,
          ...(flags.auth && {
            Authorization: `Basic ${Buffer.from(
              `${flags.auth.split(':')[0]}:${flags.auth.split(':')[1] || ''}`,
            ).toString('base64')}`,
          }),
        },
        downloadProgress: flags.download
          ? (progress: number) => {
              process.stdout.write(
                `\rDownloading... ${(progress * 100).toFixed(1)}%`,
              )
            }
          : undefined,
        follow: flags.follow,
      }

      const result = await client.request(parsedArgs.url, options)

      result.match({
        ok: (response) => {
          if (flags.download)
            process.stdout.write('\n')

          // Print Response Headers
          if (flags.verbose) {
            console.log('\nResponse Headers:')
            response.headers.forEach((value: string, key: string) => console.log(`${key}: ${value}`))
            console.log('\nResponse Body:')
          }

          // Handle Response Body
          const contentType = response.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            console.log(JSON.stringify(response.data, null, 2))
          }
          else if (typeof response.data === 'string' || Buffer.isBuffer(response.data)) {
            process.stdout.write(response.data)
          }
          else {
            console.log(response.data)
          }

          // Print Timing Info
          if (flags.verbose) {
            console.log(`\nRequest completed in ${response.timings.duration.toFixed(2)}ms`)
          }
        },
        err: (error) => {
          console.error('Error:', error.message)
          if (flags.verbose) {
            if (error.cause)
              console.error('Cause:', error.cause)
            if (error.stack)
              console.error('Stack:', error.stack)
          }
          process.exitCode = 1
        },
      })
    }
    catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    }
  })

cli
  .command('completion', 'Generate shell completion script')
  .action(() => {
    // TODO: Implement shell completion generation
    console.log('Shell completion not implemented yet')
  })

cli.command('version', 'Show the version of httx').action(() => {
  console.log(version)
})

cli.version(version)
cli.help()
cli.parse()
