import type { DecodeOptions, EncodeOptions } from '../../toon/src'
import type { InputSource } from './types'
import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import process from 'node:process'
import { consola } from 'consola'
import { estimateTokenCount } from 'tokenx'
<<<<<<< HEAD
import { decode, decodeStream, encode, encodeStream, validateJson, validateToon } from '../../toon/src'
=======
import { decode, encode } from '../../toon/src'
>>>>>>> parent of 3ef97e7 (- Analyzed current encode/decode implementation)
import { formatInputLabel, readInput } from './utils'

export async function encodeToToon(config: {
  input: InputSource
  output?: string
  indent: NonNullable<EncodeOptions['indent']>
  delimiter: NonNullable<EncodeOptions['delimiter']>
  keyFolding?: NonNullable<EncodeOptions['keyFolding']>
  flattenDepth?: number
  printStats: boolean
}): Promise<void> {
  const jsonContent = await readInput(config.input)

  let data: unknown
  try {
    data = JSON.parse(jsonContent)
  }
  catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`)
  }

  const encodeOptions: EncodeOptions = {
    delimiter: config.delimiter,
    indent: config.indent,
    keyFolding: config.keyFolding,
    flattenDepth: config.flattenDepth,
  }

  const toonOutput = encode(data, encodeOptions)

  if (config.output) {
    await fsp.writeFile(config.output, toonOutput, 'utf-8')
    const relativeInputPath = formatInputLabel(config.input)
    const relativeOutputPath = path.relative(process.cwd(), config.output)
    consola.success(`Encoded \`${relativeInputPath}\` → \`${relativeOutputPath}\``)
  }
  else {
    console.log(toonOutput)
  }

  if (config.printStats) {
    const jsonTokens = estimateTokenCount(jsonContent)
    const toonTokens = estimateTokenCount(toonOutput)
    const diff = jsonTokens - toonTokens
    const percent = ((diff / jsonTokens) * 100).toFixed(1)

    console.log()
    consola.info(`Token estimates: ~${jsonTokens} (JSON) → ~${toonTokens} (TOON)`)
    consola.success(`Saved ~${diff} tokens (-${percent}%)`)
  }
}

export async function decodeToJson(config: {
  input: InputSource
  output?: string
  indent: NonNullable<DecodeOptions['indent']>
  strict: NonNullable<DecodeOptions['strict']>
  expandPaths?: NonNullable<DecodeOptions['expandPaths']>
}): Promise<void> {
  const toonContent = await readInput(config.input)

  let data: unknown
  try {
    const decodeOptions: DecodeOptions = {
      indent: config.indent,
      strict: config.strict,
      expandPaths: config.expandPaths,
    }
    data = decode(toonContent, decodeOptions)
  }
  catch (error) {
    throw new Error(`Failed to decode TOON: ${error instanceof Error ? error.message : String(error)}`)
  }

  const jsonOutput = JSON.stringify(data, undefined, config.indent)

  if (config.output) {
    await fsp.writeFile(config.output, jsonOutput, 'utf-8')
    const relativeInputPath = formatInputLabel(config.input)
    const relativeOutputPath = path.relative(process.cwd(), config.output)
    consola.success(`Decoded \`${relativeInputPath}\` → \`${relativeOutputPath}\``)
  }
  else {
    console.log(jsonOutput)
  }
}
<<<<<<< HEAD

async function decodeToJsonStreaming(config: {
  input: InputSource
  output?: string
  indent: NonNullable<DecodeOptions['indent']>
  strict: NonNullable<DecodeOptions['strict']>
  expandPaths?: NonNullable<DecodeOptions['expandPaths']>
}): Promise<void> {
  // Create input stream
  let inputStream: Readable
  if (config.input.type === 'stdin') {
    inputStream = process.stdin
  } else {
    inputStream = createReadStream(config.input.path, { encoding: 'utf-8' })
  }

  // Create output stream
  let outputStream: NodeJS.WritableStream
  if (config.output) {
    outputStream = createWriteStream(config.output, { encoding: 'utf-8' })
  } else {
    outputStream = process.stdout
  }

  // Create decode stream
  const decodeTransform = decodeStream({
    indent: config.indent,
    strict: config.strict,
    expandPaths: config.expandPaths,
  })

  // Create a stream that formats decoded objects as JSON lines
  const jsonFormatter = new JSONFormatter(config.indent)

  // Pipe: input -> decode -> format -> output
  inputStream.pipe(decodeTransform).pipe(jsonFormatter).pipe(outputStream)

  return new Promise<void>((resolve, reject) => {
    outputStream.on('finish', () => {
      if (config.output) {
        const relativeInputPath = formatInputLabel(config.input)
        const relativeOutputPath = path.relative(process.cwd(), config.output!)
        consola.success(`Decoded \`${relativeInputPath}\` → \`${relativeOutputPath}\` (streaming)`)
      }
      resolve()
    })
    outputStream.on('error', reject)
  })
}

class JSONFormatter extends Transform {
  private indent: number

  constructor(indent: number) {
    super({ writableObjectMode: true })
    this.indent = indent
  }

  _transform(chunk: any, encoding: string, callback: (error?: Error | null) => void) {
    try {
      const jsonString = JSON.stringify(chunk, undefined, this.indent) + '\n'
      this.push(jsonString)
      callback()
    } catch (error) {
      callback(error as Error)
    }
  }
}

export async function validateData(config: {
  input: InputSource
  schemaPath: string
  isToon: boolean
}): Promise<void> {
  const inputContent = await readInput(config.input)

  // Read and parse schema
  let schema: any
  try {
    const schemaContent = await fsp.readFile(config.schemaPath, 'utf-8')
    schema = JSON.parse(schemaContent)
  } catch (error) {
    throw new Error(`Failed to read or parse schema: ${error instanceof Error ? error.message : String(error)}`)
  }

  // Validate data
  const result = config.isToon
    ? validateToon(inputContent, schema)
    : validateJson(JSON.parse(inputContent), schema)

  if (result.valid) {
    const relativeInputPath = formatInputLabel(config.input)
    consola.success(`Validation passed for \`${relativeInputPath}\``)
  } else {
    const relativeInputPath = formatInputLabel(config.input)
    consola.error(`Validation failed for \`${relativeInputPath}\``)
    for (const error of result.errors) {
      console.log(`  ${error.path || 'root'}: ${error.message}`)
    }
    process.exit(1)
  }
}
=======
>>>>>>> parent of 3ef97e7 (- Analyzed current encode/decode implementation)
