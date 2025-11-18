/**
 * Binary Reader for TOON Format
 * Provides low-level utilities for reading binary data structures
 */

import type { BinaryArrayHeader, BinaryReaderState } from './binary-types'
import { COMMA, PIPE, TAB } from '../constants'
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

export class BinaryReader {
  private state: BinaryReaderState

  constructor(buffer: Uint8Array, options: { strict?: boolean, expandPaths?: 'off' | 'safe' } = {}) {
    this.state = {
      buffer,
      position: 0,
      strict: options.strict === undefined ? true : options.strict,
      expandPaths: options.expandPaths ?? 'off',
    }
  }

  /**
   * Read a single byte
   */
  readByte(): number {
    if (this.state.position >= this.state.buffer.length) {
      throw new Error('Unexpected end of buffer')
    }
    return this.state.buffer[this.state.position++]
  }

  /**
   * Read varint-encoded 32-bit unsigned integer
   */
  readVarint(): number {
    let result = 0
    let shift = 0
    let byte: number

    do {
      byte = this.readByte()
      result |= (byte & 0x7F) << shift
      shift += 7
      if (shift > 28) {
        throw new Error('Varint too long')
      }
    } while (byte & 0x80)

    return result
  }

  /**
   * Read IEEE 754 double precision float (8 bytes)
   */
  readDouble(): number {
    if (this.state.position + 8 > this.state.buffer.length) {
      throw new Error('Unexpected end of buffer while reading double')
    }

    const view = new DataView(this.state.buffer.buffer, this.state.buffer.byteOffset + this.state.position)
    const value = view.getFloat64(0, true) // Little-endian
    this.state.position += 8
    return value
  }

  /**
   * Read UTF-8 string: length (varint) + UTF-8 bytes
   */
  readString(): string {
    const length = this.readVarint()

    if (this.state.position + length > this.state.buffer.length) {
      throw new Error('Unexpected end of buffer while reading string')
    }

    const decoder = new TextDecoder('utf-8')
    const bytes = this.state.buffer.slice(this.state.position, this.state.position + length)
    this.state.position += length

    return decoder.decode(bytes)
  }

  /**
   * Read delimiter character (maps to string)
   */
  readDelimiter(): string {
    const code = this.readByte()
    switch (code) {
      case 0x2C:
        return COMMA // ','
      case 0x09:
        return TAB // '\t'
      case 0x7C:
        return PIPE // '|'
      default:
        throw new Error(`Invalid delimiter code: 0x${code.toString(16)}`)
    }
  }

  /**
   * Read array header
   */
  readArrayHeader(): BinaryArrayHeader {
    const type = this.readByte()
    if (type !== BINARY_TYPE_ARRAY_HEADER) {
      throw new Error(`Expected array header, got type ${type}`)
    }

    const length = this.readVarint()
    const delimiter = this.readDelimiter()
    const fieldCount = this.readVarint()

    let fields: string[] | undefined
    if (fieldCount > 0) {
      fields = []
      for (let i = 0; i < fieldCount; i++) {
        fields.push(this.readString())
      }
    }

    return { length, delimiter, fields }
  }

  /**
   * Read any primitive value (null, boolean, number, string)
   */
  readPrimitive(): null | boolean | number | string {
    const type = this.readByte()

    switch (type) {
      case BINARY_TYPE_NULL:
        return null
      case BINARY_TYPE_FALSE:
        return false
      case BINARY_TYPE_TRUE:
        return true
      case BINARY_TYPE_NUMBER:
        return this.readDouble()
      case BINARY_TYPE_STRING:
        return this.readString()
      default:
        throw new Error(`Unknown primitive type: ${type}`)
    }
  }

  /**
   * Read start marker (object or array)
   */
  readStart(): typeof BINARY_TYPE_OBJECT | typeof BINARY_TYPE_ARRAY {
    const type = this.readByte()
    if (type !== BINARY_TYPE_OBJECT && type !== BINARY_TYPE_ARRAY) {
      throw new Error(`Expected start marker, got type ${type}`)
    }
    return type
  }

  /**
   * Read end marker
   */
  readEnd(): void {
    const type = this.readByte()
    if (type !== BINARY_TYPE_END) {
      throw new Error(`Expected end marker, Got type ${type}`)
    }
  }

  /**
   * Check if at end marker without consuming it
   */
  peekEnd(): boolean {
    if (this.state.position >= this.state.buffer.length) {
      return false
    }
    return this.state.buffer[this.state.position] === BINARY_TYPE_END
  }

  /**
   * Get current position (for debugging)
   */
  getPosition(): number {
    return this.state.position
  }

  /**
   * Check if reached end of buffer
   */
  isAtEnd(): boolean {
    return this.state.position >= this.state.buffer.length
  }

  /**
   * Get internal state (for advanced use)
   */
  getState(): BinaryReaderState {
    return { ...this.state }
  }
}
