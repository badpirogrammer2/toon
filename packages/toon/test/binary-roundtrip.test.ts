/**
 * Binary TOON Round-trip Compatibility Tests
 * Ensures binary encoding/decoding produces identical results to text TOON
 */

import { describe, expect, it } from 'vitest'
import { decode, encode } from '../src'
import { decodeBinary } from '../src/binary/binary-decoders'
import { encodeBinary } from '../src/binary/binary-encoders'

// Utility function to normalize undefined values away (like text TOON does)
function normalizeData(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data
        .filter(item => item !== undefined)
        .map(normalizeData)
    }
    else {
      const result: any = {}
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          result[key] = normalizeData(value)
        }
      }
      return result
    }
  }

  return data
}

describe('binary TOON round-trip compatibility', () => {
  describe('primitive values', () => {
    it('null round-trip', () => {
      const data = null
      const normalized = normalizeData(data)

      const textEncoded = encode(data)
      const textDecoded = decode(textEncoded)

      const binaryEncoded = encodeBinary(data)
      const binaryDecoded = decodeBinary(binaryEncoded)

      expect(binaryDecoded).toEqual(normalized)
      expect(binaryDecoded).toEqual(textDecoded)
    })

    it('boolean round-trip', () => {
      const testCases = [true, false]

      for (const data of testCases) {
        const normalized = normalizeData(data)

        const textEncoded = encode(data)
        const textDecoded = decode(textEncoded)

        const binaryEncoded = encodeBinary(data)
        const binaryDecoded = decodeBinary(binaryEncoded)

        expect(binaryDecoded).toEqual(normalized)
        expect(binaryDecoded).toEqual(textDecoded)
      }
    })

    it('number round-trip', () => {
      const testCases = [0, 42, -42, 3.14, -3.14, 1e6, -1e6, Infinity, -Infinity, Number.NaN, 0, -0]

      for (const data of testCases) {
        const normalized = normalizeData(data)

        const textEncoded = encode(data)
        const textDecoded = decode(textEncoded)

        const binaryEncoded = encodeBinary(data)
        const binaryDecoded = decodeBinary(binaryEncoded)

        // Special handling for NaN (NaN !== NaN)
        if (Number.isNaN(normalized)) {
          expect(Number.isNaN(binaryDecoded as number)).toBe(true)
          expect(Number.isNaN(textDecoded as number)).toBe(true)
        }
        else {
          expect(binaryDecoded).toEqual(normalized)
          expect(binaryDecoded).toEqual(textDecoded)
        }
      }
    })

    it('string round-trip', () => {
      const testCases = ['', 'hello', '🚀👨‍💻', 'unicode: αβγδε', 'special\n\t\rchars']

      for (const data of testCases) {
        const normalized = normalizeData(data)

        const textEncoded = encode(data)
        const textDecoded = decode(textEncoded)

        const binaryEncoded = encodeBinary(data)
        const binaryDecoded = decodeBinary(binaryEncoded)

        expect(binaryDecoded).toEqual(normalized)
        expect(binaryDecoded).toEqual(textDecoded)
      }
    })
  })

  describe('arrays', () => {
    it('empty array round-trip', () => {
      const data: any[] = []
      const normalized = normalizeData(data)

      const textEncoded = encode(data)
      const textDecoded = decode(textEncoded)

      const binaryEncoded = encodeBinary(data)
      const binaryDecoded = decodeBinary(binaryEncoded)

      expect(binaryDecoded).toEqual(normalized)
      expect(binaryDecoded).toEqual(textDecoded)
    })

    it('primitive arrays round-trip', () => {
      const testCases = [
        [1, 2, 3],
        [null, true, false],
        [3.14, 'hello', 42],
        ['a', 'b', 'c', 'd'],
      ]

      for (const data of testCases) {
        const normalized = normalizeData(data)

        const textEncoded = encode(data)
        const textDecoded = decode(textEncoded)

        const binaryEncoded = encodeBinary(data)
        const binaryDecoded = decodeBinary(binaryEncoded)

        expect(binaryDecoded).toEqual(normalized)
        expect(binaryDecoded).toEqual(textDecoded)
      }
    })

    it('mixed arrays round-trip', () => {
      const testCases = [
        [1, { nested: true }, 'string'],
        [{ a: 1 }, [2, 3], null, true],
      ]

      for (const data of testCases) {
        const normalized = normalizeData(data)

        const textEncoded = encode(data)
        const textDecoded = decode(textEncoded)

        const binaryEncoded = encodeBinary(data)
        const binaryDecoded = decodeBinary(binaryEncoded)

        expect(binaryDecoded).toEqual(normalized)
        expect(binaryDecoded).toEqual(textDecoded)
      }
    })

    it('tabular array round-trip', () => {
      const data = [
        { name: 'Alice', age: 30, active: true },
        { name: 'Bob', age: 25, active: false },
        { name: 'Charlie', age: 35, active: true },
      ]
      const normalized = normalizeData(data)

      const textEncoded = encode(data)
      const textDecoded = decode(textEncoded)

      const binaryEncoded = encodeBinary(data)
      const binaryDecoded = decodeBinary(binaryEncoded)

      expect(binaryDecoded).toEqual(normalized)
      expect(binaryDecoded).toEqual(textDecoded)
    })
  })

  describe('objects', () => {
    it('empty object round-trip', () => {
      const data = {}
      const normalized = normalizeData(data)

      const textEncoded = encode(data)
      const textDecoded = decode(textEncoded)

      const binaryEncoded = encodeBinary(data)
      const binaryDecoded = decodeBinary(binaryEncoded)

      expect(binaryDecoded).toEqual(normalized)
      expect(binaryDecoded).toEqual(textDecoded)
    })

    it('simple objects round-trip', () => {
      const testCases = [
        { name: 'Alice', age: 30 },
        { active: true, count: 42.5, text: 'hello' },
        { nullValue: null, emptyString: '' },
      ]

      for (const data of testCases) {
        const normalized = normalizeData(data)

        const textEncoded = encode(data)
        const textDecoded = decode(textEncoded)

        const binaryEncoded = encodeBinary(data)
        const binaryDecoded = decodeBinary(binaryEncoded)

        expect(binaryDecoded).toEqual(normalized)
        expect(binaryDecoded).toEqual(textDecoded)
      }
    })

    it('nested objects round-trip', () => {
      const data = {
        user: {
          name: 'Bob',
          profile: {
            age: 25,
            active: true,
            settings: {
              theme: 'dark',
              notifications: false,
            },
          },
        },
        metadata: {
          created: Date.now(),
          version: '1.0',
        },
      }
      const normalized = normalizeData(data)

      const textEncoded = encode(data)
      const textDecoded = decode(textEncoded)

      const binaryEncoded = encodeBinary(data)
      const binaryDecoded = decodeBinary(binaryEncoded)

      expect(binaryDecoded).toEqual(normalized)
      expect(binaryDecoded).toEqual(textDecoded)
    })

    it('objects with arrays round-trip', () => {
      const data = {
        items: [1, 2, 3],
        users: [
          { id: 1, name: 'A' },
          { id: 2, name: 'B' },
        ],
        config: {
          flags: [true, false, null],
          settings: {
            values: [1, 'two', 3.14],
          },
        },
      }
      const normalized = normalizeData(data)

      const textEncoded = encode(data)
      const textDecoded = decode(textEncoded)

      const binaryEncoded = encodeBinary(data)
      const binaryDecoded = decodeBinary(binaryEncoded)

      expect(binaryDecoded).toEqual(normalized)
      expect(binaryDecoded).toEqual(textDecoded)
    })

    it('handles undefined values like text TOON', () => {
      const data = {
        defined: 'value',
        undefined,
        nested: {
          present: 42,
          absent: undefined,
          array: [1, undefined, 3],
        },
      }
      const normalized = normalizeData(data) // Should remove undefined values

      const textEncoded = encode(data)
      const textDecoded = decode(textEncoded)

      const binaryEncoded = encodeBinary(data)
      const binaryDecoded = decodeBinary(binaryEncoded)

      expect(binaryDecoded).toEqual(normalized)
      expect(binaryDecoded).toEqual(textDecoded)
    })
  })

  describe('complex real-world scenarios', () => {
    it('aPI response round-trip', () => {
      const data = {
        success: true,
        data: {
          users: [
            { id: 1, email: 'user1@example.com', roles: ['admin', 'user'] },
            { id: 2, email: 'user2@example.com', roles: ['user'] },
          ],
          metadata: {
            total: 2,
            page: 1,
            perPage: 10,
            filters: {
              active: true,
              department: 'engineering',
            },
          },
        },
        timestamp: Date.now(),
        version: 'v2.1',
      }
      const normalized = normalizeData(data)

      const textEncoded = encode(data)
      const textDecoded = decode(textEncoded)

      const binaryEncoded = encodeBinary(data)
      const binaryDecoded = decodeBinary(binaryEncoded)

      expect(binaryDecoded).toEqual(normalized)
      expect(binaryDecoded).toEqual(textDecoded)
    })

    it('configuration object round-trip', () => {
      const data = {
        database: {
          host: 'localhost',
          port: 5432,
          credentials: {
            username: 'admin',
            password: 'secret',
          },
          ssl: {
            enabled: true,
            cert: 'path/to/cert.pem',
          },
        },
        features: {
          auth: true,
          notifications: false,
          analytics: {
            enabled: true,
            trackingId: 'GA-12345',
            events: ['click', 'view', 'purchase'],
          },
        },
        limits: {
          maxUsers: 1000,
          maxRequestsPerMinute: 60,
          fileUploadSizeMB: 10,
        },
      }
      const normalized = normalizeData(data)

      const textEncoded = encode(data)
      const textDecoded = decode(textEncoded)

      const binaryEncoded = encodeBinary(data)
      const binaryDecoded = decodeBinary(binaryEncoded)

      expect(binaryDecoded).toEqual(normalized)
      expect(binaryDecoded).toEqual(textDecoded)
    })
  })

  describe('encoding options', () => {
    it('respects keyFolding option', () => {
      const data = {
        'config.database': {
          host: 'localhost',
          port: 5432,
        },
        'regularKey': 'value',
      }
      const normalized = normalizeData(data)

      // Test with keyFolding enabled
      const textEncoded = encode(data, { keyFolding: 'safe' })
      const textDecoded = decode(textEncoded, { expandPaths: 'safe' })

      const binaryEncoded = encodeBinary(data, { keyFolding: 'safe' })
      const binaryDecoded = decodeBinary(binaryEncoded, { expandPaths: 'safe' })

      expect(binaryDecoded).toEqual(normalized)
      expect(binaryDecoded).toEqual(textDecoded)
    })

    it('respects delimiter options', () => {
      const data = [
        { a: 1, b: 2, c: 3 },
        { a: 4, b: 5, c: 6 },
      ]
      const normalized = normalizeData(data)

      const textEncoded = encode(data)
      const textDecoded = decode(textEncoded)

      const binaryEncoded = encodeBinary(data, { delimiter: '\t' })
      const binaryDecoded = decodeBinary(binaryEncoded)

      expect(binaryDecoded).toEqual(normalized)
      expect(binaryDecoded).toEqual(textDecoded)
    })
  })

  describe('performance expectations', () => {
    it('handles large tabular datasets efficiently', () => {
      // Create a large dataset similar to benchmark scenarios
      const generateData = (size: number) => {
        const data = []
        for (let i = 0; i < size; i++) {
          data.push({
            id: i + 1,
            name: `User${i + 1}`,
            email: `user${i + 1}@example.com`,
            active: Math.random() > 0.5,
            age: Math.floor(Math.random() * 60) + 20,
            department: ['engineering', 'sales', 'marketing', 'support'][Math.floor(Math.random() * 4)],
            score: Math.random() * 100,
          })
        }
        return data
      }

      const data = generateData(100) // 100 records
      const normalized = normalizeData(data)

      const textEncoded = encode(data)
      const textDecoded = decode(textEncoded)

      const binaryEncoded = encodeBinary(data)
      const binaryDecoded = decodeBinary(binaryEncoded)

      expect(binaryDecoded).toEqual(normalized)
      expect(binaryDecoded).toEqual(textDecoded)

      // Verify binary is actually more compact
      expect(binaryEncoded.length).toBeLessThan(textEncoded.length)
    })

    it('handles deeply nested structures', () => {
      // Create deeply nested structure
      const createNested = (depth: number): any => {
        if (depth === 0) {
          return { value: Math.random() }
        }
        return {
          level: depth,
          nested: createNested(depth - 1),
          data: Array.from({ length: 3 }, () => Math.random()),
        }
      }

      const data = createNested(5)
      const normalized = normalizeData(data)

      const textEncoded = encode(data)
      const textDecoded = decode(textEncoded)

      const binaryEncoded = encodeBinary(data)
      const binaryDecoded = decodeBinary(binaryEncoded)

      expect(binaryDecoded).toEqual(normalized)
      expect(binaryDecoded).toEqual(textDecoded)
    })
  })
})
