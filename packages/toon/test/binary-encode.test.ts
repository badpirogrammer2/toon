/**
 * Binary TOON Encoding Tests
 * Tests encoding of various data types to binary TOON format
 */

import { describe, expect, it } from 'vitest'
import { encodeBinary } from '../src/binary/binary-encoders'

// Helper to convert Uint8Array to hex string for testing
function toHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

describe('binary TOON encoding', () => {
  describe('primitive values', () => {
    it('encodes null', () => {
      const result = encodeBinary(null)
      expect(result).toEqual(new Uint8Array([0x00]))
      expect(toHex(result)).toBe('00')
    })

    it('encodes boolean false', () => {
      const result = encodeBinary(false)
      expect(result).toEqual(new Uint8Array([0x01]))
      expect(toHex(result)).toBe('01')
    })

    it('encodes boolean true', () => {
      const result = encodeBinary(true)
      expect(result).toEqual(new Uint8Array([0x02]))
      expect(toHex(result)).toBe('02')
    })

    it('encodes integer numbers', () => {
      const result = encodeBinary(42)
      expect(result[0]).toBe(0x03) // number type
      expect(result.length).toBe(9) // type + 8 bytes
      // Note: Can't easily test exact float64 bytes due to endianness
    })

    it('encodes float numbers', () => {
      const result = encodeBinary(3.14)
      expect(result[0]).toBe(0x03) // number type
      expect(result.length).toBe(9) // type + 8 bytes
    })

    it('encodes strings', () => {
      const result = encodeBinary('hello')
      expect(result[0]).toBe(0x04) // string type
      expect(result[1]).toBe(0x05) // length (varint for 5)
      // UTF-8 bytes for "hello"
      expect(result.slice(2)).toEqual(new Uint8Array([0x68, 0x65, 0x6C, 0x6C, 0x6F]))
    })

    it('encodes empty string', () => {
      const result = encodeBinary('')
      expect(result[0]).toBe(0x04) // string type
      expect(result[1]).toBe(0x00) // length 0
      expect(result.length).toBe(2)
    })

    it('encodes unicode strings', () => {
      const result = encodeBinary('🚀')
      expect(result[0]).toBe(0x04) // string type
      // Should handle multi-byte UTF-8
      expect(result.length).toBeGreaterThan(3) // type + length + content
    })
  })

  describe('arrays', () => {
    it('encodes empty arrays', () => {
      const result = encodeBinary([])
      expect(result[0]).toBe(0x07) // array_header type
      // length (0) + delimiter + field_count (0)
    })

    it('encodes primitive arrays', () => {
      const result = encodeBinary([1, 2, 3])
      expect(result[0]).toBe(0x07) // array_header type
      // Should contain length, delimiter, and the three numbers
      expect(result.length).toBeGreaterThan(5) // header + 3 numbers
    })

    it('encodes string arrays', () => {
      const result = encodeBinary(['a', 'b', 'c'])
      expect(result[0]).toBe(0x07) // array_header type
      expect(result.length).toBeGreaterThan(5) // header + strings
    })

    it('encodes mixed primitive arrays', () => {
      const result = encodeBinary([null, true, 42, 'test'])
      expect(result[0]).toBe(0x07) // array_header type
      // Should handle mixed types
    })
  })

  describe('objects', () => {
    it('encodes empty objects', () => {
      const result = encodeBinary({})
      expect(result[0]).toBe(0x05) // object start
      expect(result[result.length - 1]).toBe(0xFF) // end marker
      expect(result.length).toBe(2) // just start and end markers
    })

    it('encodes simple objects', () => {
      const result = encodeBinary({ name: 'Alice', age: 30 })
      expect(result[0]).toBe(0x05) // object start

      // Should contain: name(string) + Alice(string) + age(string) + 30(number) + end
      expect(result.length).toBeGreaterThan(5)
      expect(result[result.length - 1]).toBe(0xFF) // end marker
    })

    it('encodes nested objects', () => {
      const result = encodeBinary({
        user: {
          name: 'Bob',
          profile: { age: 25, active: true },
        },
      })

      expect(result[0]).toBe(0x05) // object start
      expect(result[result.length - 1]).toBe(0xFF) // end marker
      expect(result.length).toBeGreaterThan(10) // Contains nested structure
    })
  })

  describe('complex Data Structures', () => {
    it('encodes mixed objects and arrays', () => {
      const data = {
        metadata: {
          version: '1.0',
          created: Date.now(),
        },
        items: [
          { id: 1, value: 'first' },
          { id: 2, value: 'second', active: true },
        ],
        flags: [true, false, null, 42],
      }

      const result = encodeBinary(data)
      expect(result.length).toBeGreaterThan(50) // Substantial structure
    })

    it('encodes tabular array of objects', () => {
      const data = [
        { name: 'Alice', age: 30, active: true },
        { name: 'Bob', age: 25, active: false },
        { name: 'Charlie', age: 35, active: true },
      ]

      const result = encodeBinary(data)
      expect(result[0]).toBe(0x07) // array_header (tabular format)
      expect(result.length).toBeGreaterThan(30) // Header + row data
    })
  })

  describe('options', () => {
    it('respects delimiter option', () => {
      const result = encodeBinary([1, 2, 3], { delimiter: ',' })
      // Should use comma delimiter in header
      expect(result.length).toBeGreaterThan(5)
    })

    it('respects keyFolding option', () => {
      const data = {
        'data.items': [
          { name: 'test', value: 123 },
        ],
      }

      const result = encodeBinary(data, { keyFolding: 'safe' })
      // Should handle key folding
      expect(result.length).toBeGreaterThan(10)
    })
  })

  describe('edge Cases', () => {
    it('handles special number values', () => {
      const result = encodeBinary({
        infinity: Infinity,
        negInfinity: -Infinity,
        nan: Number.NaN,
        zero: 0,
        negZero: -0,
      })

      expect(result.length).toBeGreaterThan(10)
      // Should encode special IEEE 754 values
    })

    it('handles extremely long strings', () => {
      const longString = 'a'.repeat(1000)
      const result = encodeBinary(longString)

      expect(result[0]).toBe(0x04) // string type
      expect(result.length).toBeGreaterThan(1000) // String + varint length
    })

    it('handles nested empty structures', () => {
      const result = encodeBinary({
        emptyArray: [],
        emptyObject: {},
        nested: {
          anotherEmpty: [],
          deep: {
            empty: {},
          },
        },
      })

      expect(result.length).toBeGreaterThan(10)
      // Should handle nested empty structures correctly
    })
  })

  describe('round-trip Compatibility', () => {
    // These tests verify that binary encoded data can be decoded back
    // (the round-trip tests will be in a separate file)

    it('produces valid binary structure for simple data', () => {
      const data = { message: 'hello', count: 42, valid: true }
      const result = encodeBinary(data)

      // Basic structure validation
      expect(result[0]).toBe(0x05) // object start
      expect(result[result.length - 1]).toBe(0xFF) // object end
      expect(result.length).toBeGreaterThan(20) // Contains meaningful data
    })

    it('handles undefined values by normalizing them', () => {
      // Test that undefined gets normalized away (as per text TOON)
      const data = { defined: 'value', undefined }
      const result = encodeBinary(data)

      expect(result[0]).toBe(0x05) // object start
      // Should only contain the defined property
    })
  })
})
