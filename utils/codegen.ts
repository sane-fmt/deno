import { encode } from './std/encoding/base64.ts'
import { join } from './std/path.ts'
import ROOT from './workspace.ts'

export const codeBase64 = (base64: string): string =>
  [
    '/// <reference types="./base64.d.ts" />',
    '// sane-fmt-ignore-file',
    '/**',
    ' * Base64 representation of sane-fmt wasi executable',
    ' * @type {string}',
    ' */',
    `export const base64 = '${base64}'`,
    'export default base64',
    '',
  ].join('\n')

export const codeVersionTS = (version: string): string =>
  [
    '// sane-fmt-ignore-file',
    `export const version = '${version}'`,
    'export default version',
    '',
  ].join('\n')

export const codeVersionJSON = (version: string): string => JSON.stringify(version) + '\n'

export interface CodeGeneratorOptions {
  readonly log: (...args: unknown[]) => void
  readonly version: string
  readonly filename: string
}

export class CodeGenerator {
  constructor(private readonly options: CodeGeneratorOptions) {}

  public readonly pathBase64 = join(ROOT, 'lib', 'base64.js')
  public readonly pathVersionTS = join(ROOT, 'lib', 'version.ts')
  public readonly pathVersionJSON = join(ROOT, 'lib', 'version.json')
  public readonly pathVersionTXT = join(ROOT, 'lib', 'version.txt')

  public async generateBase64() {
    const data = await Deno
      .readFile(this.options.filename)
      .then(encode)
      .then(codeBase64)

    await Deno.writeTextFile(this.pathBase64, data)
  }

  public async generateVersionTS() {
    await Deno.writeTextFile(this.pathVersionTS, codeVersionTS(this.options.version))
  }

  public async generateVersionJSON() {
    await Deno.writeTextFile(this.pathVersionJSON, codeVersionJSON(this.options.version))
  }

  public async generateVersionTXT() {
    await Deno.writeTextFile(this.pathVersionTXT, this.options.version)
  }

  public async runGenerator() {
    const { log } = this.options
    const handlePromise = (promise: Promise<void>, path: string) =>
      promise.catch(error => {
        log(`error: Failed to generate ${path}`)
        throw error
      })
    log('generating...')
    await Promise.all([
      handlePromise(this.generateBase64(), this.pathBase64),
      handlePromise(this.generateVersionTS(), this.pathVersionTS),
      handlePromise(this.generateVersionJSON(), this.pathVersionJSON),
      handlePromise(this.generateVersionTXT(), this.pathVersionTXT),
    ])
    log('done.')
  }
}

export default CodeGenerator
