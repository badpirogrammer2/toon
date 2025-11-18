// Binary TOON Format Constants and Types

/**
 * Binary TOON type identifiers (1 byte each)
 */
export const BINARY_TYPE_NULL = 0x00 as const
export const BINARY_TYPE_FALSE = 0x01 as const
export const BINARY_TYPE_TRUE = 0x02 as const
export const BINARY_TYPE_NUMBER = 0x03 as const
export const BINARY_TYPE_STRING = 0x04 as const
export const BINARY_TYPE_OBJECT = 0x05 as const
export const BINARY_TYPE_ARRAY = 0x06 as const
export const BINARY_TYPE_ARRAY_HEADER = 0x07 as const
export const BINARY_TYPE_END = 0xFF as const

/**
 * Type alias for binary type identifiers
 */
export type BinaryType = typeof BINARY_TYPE_NULL | typeof BINARY_TYPE_FALSE | typeof BINARY_TYPE_TRUE | typeof BINARY_TYPE_NUMBER | typeof BINARY_TYPE_STRING | typeof BINARY_TYPE_OBJECT | typeof BINARY_TYPE_ARRAY | typeof BINARY_TYPE_ARRAY_HEADER | typeof BINARY_TYPE_END

/**
 * Binary TOON array header structure
 */
export interface BinaryArrayHeader {
  length: number
  delimiter: string
  fields?: string[]
}

/**
 * Binary options for encoding/decoding (subset of main options)
 */
export interface BinaryEncodeOptions {
  /**
   * Delimiter to use for arrays (default: comma)
   */
  delimiter?: string
  /**
   * Enable key folding for nested objects
   */
  keyFolding?: 'off' | 'safe'
  /**
   * Maximum depth for key folding
   */
  flattenDepth?: number
}

export interface BinaryDecodeOptions {
  /**
   * When true, enforce strict validation
   */
  strict?: boolean
  /**
   * Enable path expansion for dotted keys
   */
  expandPaths?: 'off' | 'safe'
}

/**
 * Resolved binary options with defaults
 */
export type ResolvedBinaryEncodeOptions = Required<BinaryEncodeOptions>
export type ResolvedBinaryDecodeOptions = Required<BinaryDecodeOptions>

/**
 * Internal reader state for binary decoding
 */
export interface BinaryReaderState {
  buffer: Uint8Array
  position: number
  strict: boolean
  expandPaths: 'off' | 'safe'
}
