/**
 * Binary Writer for TOON Format
 * Provides low-level utilities for writing binary data structures
 */

import type { BinaryType } from './binary-types'
import {
  BINARY_TYPE_ARRAY,
  BINARY_TYPE_ARRAY_HEADER,
  BINARY_TYPE_END,
  BINARY_TYPE_FALSE,
  BINARY_TYPE_NULL,
  BINARY_TYPE_NUMBER,
  BINARY_TYPE_OBJECT,
  BINARY_TYPE_STRING,
  BINARY_TYPE_TRUE,

} from './binary-types'

export class BinaryWriter {
  private buffer: Uint8Array
  private view: DataView
  private position: number

  constructor(initialSize: number = 1024) {
    this.buffer = new Uint8Array(initialSize)
    this.view = new DataView(this.buffer.buffer)
    this.position = 0
  }

  /**
   * Get the final Uint8Array (sliced to actual size)
   */
  toUint8Array(): Uint8Array {
    return this.buffer.slice(0, this.position)
  }

  /**
   * Write a single byte
   */
  writeByte(value: number): void {
    this.ensureCapacity(1)
    this.view.setUint8(this.position, value)
    this.position += 1
  }

  /**
   * Write a 32-bit unsigned integer as varint
   * Varint encoding for compact representation of integers
   */
  writeVarint(value: number): void {
    do {
      let byte = value & 0x7F
      value >>>= 7
      if (value > 0) {
        byte |= 0x80
      }
      this.writeByte(byte)
    } while (value > 0)
  }

  /**
   * Write IEEE 754 double precision float (8 bytes)
   */
  writeDouble(value: number): void {
    this.ensureCapacity(8)
    this.view.setFloat64(this.position, value, true) // Little-endian
    this.position += 8
  }

  /**
   * Write UTF-8 string: length (varint) + UTF-8 bytes
   */
  writeString(value: string): void {
    // Convert string to UTF-8 bytes
    const encoder = new TextEncoder()
    const bytes = encoder.encode(value)

    // Write length as varint
    this.writeVarint(bytes.length)

    // Write UTF-8 bytes
    this.ensureCapacity(bytes.length)
    this.buffer.set(bytes, this.position)
    this.position += bytes.length
  }

  /**
   * Write delimiter character (1 byte: ',', '\t', or '|')
   */
  writeDelimiter(value: string): void {
    const code = value.charCodeAt(0)
    if (code !== 0x2C && code !== 0x09 && code !== 0x7C) { // , \t |
      throw new Error(`Invalid delimiter: ${value}`)
    }
    this.writeByte(code)
  }

  /**
   * Write array header: type + length (varint) + delimiter + field count (varint) + fields
   */
  writeArrayHeader(length: number, delimiter: string, fields?: string[]): void {
    this.writeByte(BINARY_TYPE_ARRAY_HEADER)
    this.writeVarint(length)
    this.writeDelimiter(delimiter)

    if (fields && fields.length > 0) {
      this.writeVarint(fields.length)
      for (const field of fields) {
        this.writeString(field)
      }
    }
    else {
      this.writeVarint(0) // No fields for non-tabular arrays
    }
  }

  /**
   * Write object/array start marker
   */
  writeStart(type: BinaryType): void {
    if (type !== BINARY_TYPE_OBJECT && type !== BINARY_TYPE_ARRAY) {
      throw new Error(`Invalid start type: ${type}`)
    }
    this.writeByte(type)
  }

  /**
   * Write end marker
   */
  writeEnd(): void {
    this.writeByte(BINARY_TYPE_END)
  }

  /**
   * Write primitive value
   */
  writePrimitive(value: null | boolean | number | string): void {
    if (value === null) {
      this.writeByte(BINARY_TYPE_NULL)
    }
    else if (typeof value === 'boolean') {
      this.writeByte(value ? BINARY_TYPE_TRUE : BINARY_TYPE_FALSE)
    }
    else if (typeof value === 'number') {
      this.writeByte(BINARY_TYPE_NUMBER)
      this.writeDouble(value)
    }
    else if (typeof value === 'string') {
      this.writeByte(BINARY_TYPE_STRING)
      this.writeString(value)
    }
    else {
      throw new TypeError(`Unsupported primitive type: ${typeof value}`)
    }
  }

  /**
   * Ensure buffer has enough capacity for additional bytes
   */
  private ensureCapacity(additionalBytes: number): void {
    const requiredSize = this.position + additionalBytes
    if (requiredSize <= this.buffer.length) {
      return
    }

    // Grow buffer by at least doubling, or to required size
    const newSize = Math.max(this.buffer.length * 2, requiredSize)
    const newBuffer = new Uint8Array(newSize)
    newBuffer.set(this.buffer)
    this.buffer = newBuffer
    this.view = new DataView(this.buffer.buffer)
  }

  /**
   * Get current position (for debugging)
   */
  getPosition(): number {
    return this.position
  }
}
