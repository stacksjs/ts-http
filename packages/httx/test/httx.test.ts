import { describe, expect, it } from 'bun:test'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

describe('httx CLI', () => {
  const cliPath = resolve(import.meta.dir, '../bin/cli.ts')
  const cli = `bun ${cliPath}`

  describe('GET requests', () => {
    it('should fetch todos', async () => {
      const output = execSync(`${cli} get https://dummyjson.com/todos/1`).toString()
      const response = JSON.parse(output)
      expect(response.id).toBe(1)
      expect(response.todo).toBeDefined()
      expect(response.completed).toBeDefined()
    })

    it('should handle query parameters', async () => {
      const output = execSync(`${cli} get 'https://dummyjson.com/todos?limit=1'`).toString()
      const response = JSON.parse(output)
      expect(Array.isArray(response.todos)).toBe(true)
      expect(response.todos.length).toBe(1)
    })
  })

  describe('POST requests', () => {
    it('should create new post with JSON data', async () => {
      const output = execSync(
        `${cli} -j post https://dummyjson.com/products/add title="Test Product" price:=99.99`,
      ).toString()
      const response = JSON.parse(output)
      expect(response.id).toBeDefined()
      expect(response.title).toBe('Test Product')
      expect(Number.parseFloat(response.price)).toBe(99.99)
    })

    it('should handle form data', async () => {
      const output = execSync(
        `${cli} -f post https://dummyjson.com/products/add title=Test price=99.99`,
      ).toString()
      const response = JSON.parse(output)
      expect(response.id).toBeDefined()
    })
  })

  describe('PUT requests', () => {
    it('should update existing post', async () => {
      const output = execSync(
        `${cli} -j put https://dummyjson.com/posts/1 title="Updated Title"`,
      ).toString()
      const response = JSON.parse(output)
      expect(response.id).toBe(1)
      expect(response.title).toBe('Updated Title')
    })
  })

  describe('DELETE requests', () => {
    it('should delete post', async () => {
      const output = execSync(`${cli} delete https://dummyjson.com/posts/1`).toString()
      const response = JSON.parse(output)
      expect(response.isDeleted).toBe(true)
      expect(response.deletedOn).toBeDefined()
    })
  })

  describe('Authentication', () => {
    it('should handle basic auth', async () => {
      const output = execSync(
        `${cli} -j post https://dummyjson.com/auth/login username=emilys password=emilyspass`,
      ).toString()
      const response = JSON.parse(output)
      expect(response.accessToken).toBeDefined()
    })
  })

  describe('Headers', () => {
    it('should send custom headers', async () => {
      const output = execSync(
        `${cli} get https://dummyjson.com/products/1 X-Custom-Header:test`,
      ).toString()
      const response = JSON.parse(output)
      expect(response.id).toBe(1)
    })
  })

  describe('Error handling', () => {
    it('should handle invalid URLs', async () => {
      let threw = false
      try {
        execSync(`${cli} get not-a-valid-url`)
      }
      catch (error: any) {
        threw = true
        expect(error.stderr.toString()).toMatch(/invalid|unable to connect/i)
      }
      expect(threw).toBe(true)
    })

    it('should handle network errors', async () => {
      let threw = false
      try {
        execSync(`${cli} get https://nonexistent.example.com`)
      }
      catch (error: any) {
        threw = true
        expect(error.stderr.toString()).toContain('Unable to connect')
      }
      expect(threw).toBe(true)
    })
  })

  describe('Verbose output', () => {
    it('should show headers and timing in verbose mode', async () => {
      const output = execSync(`${cli} -v get https://dummyjson.com/todos/1 2>&1`).toString()
      expect(output).toContain('Response Headers:')
      expect(output).toMatch(/Request completed in \d+\.\d+ms/)
    })
  })
})
