import { encode } from './std/encoding/base64.ts'
import { join } from './std/path.ts'
import once from './x/once.ts'
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
  readonly #options: CodeGeneratorOptions
  constructor(options: CodeGeneratorOptions) {
    this.#options = options
  }

  public readonly pathBase64 = join(ROOT, 'lib', 'base64.js')
  public readonly pathVersionTS = join(ROOT, 'lib', 'version.ts')
  public readonly pathVersionJSON = join(ROOT, 'lib', 'version.json')
  public readonly pathVersionTXT = join(ROOT, 'lib', 'version.txt')

  public readonly loadBase64 = once(() =>
    Deno
      .readFile(this.#options.filename)
      .then(encode)
      .then(codeBase64)
  )

  public async generateBase64() {
    await Deno.writeTextFile(this.pathBase64, await this.loadBase64())
  }

  public async generateVersionTS() {
    await Deno.writeTextFile(this.pathVersionTS, codeVersionTS(this.#options.version))
  }

  public async generateVersionJSON() {
    await Deno.writeTextFile(this.pathVersionJSON, codeVersionJSON(this.#options.version))
  }

  public async generateVersionTXT() {
    await Deno.writeTextFile(this.pathVersionTXT, this.#options.version)
  }

  public async runGenerator() {
    const { log } = this.#options
    async function handlePromise(promise: Promise<void>, path: string) {
      log('Generate', path)
      await promise.catch(error => {
        log(`error: Failed to generate ${path}`)
        throw error
      })
    }
    const base64 = this.loadBase64().then(
      () => handlePromise(this.generateBase64(), this.pathBase64),
      error => {
        log(`error: Failed to load base64 from ${this.#options.filename}`)
        throw error
      },
    )
    await Promise.all([
      base64,
      handlePromise(this.generateVersionTS(), this.pathVersionTS),
      handlePromise(this.generateVersionJSON(), this.pathVersionJSON),
      handlePromise(this.generateVersionTXT(), this.pathVersionTXT),
    ])
    log('done.')
  }
}

export default CodeGenerator
