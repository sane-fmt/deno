import { encode } from './std/encoding/base64.ts'
import { join } from './std/path.ts'
import Artifact from './artifact.ts'
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

export class CodeGenerator<Version extends string> {
  #artifact: Artifact<Version>

  constructor(artifact: Artifact<Version>) {
    this.#artifact = artifact
  }

  public readonly pathBase64 = join(ROOT, 'lib', 'base64.js')
  public readonly pathVersionTS = join(ROOT, 'lib', 'version.ts')
  public readonly pathVersionJSON = join(ROOT, 'lib', 'version.json')
  public readonly pathVersionTXT = join(ROOT, 'lib', 'version.txt')

  public async generateBase64() {
    const data = await Deno
      .readFile(this.#artifact.path)
      .then(encode)
      .then(codeBase64)

    await Deno.writeTextFile(this.pathBase64, data)
  }

  public async generateVersionTS() {
    await Deno.writeTextFile(this.pathVersionTS, codeVersionTS(this.#artifact.version))
  }

  public async generateVersionJSON() {
    await Deno.writeTextFile(this.pathVersionJSON, codeVersionJSON(this.#artifact.version))
  }

  public async generateVersionTXT() {
    await Deno.writeTextFile(this.pathVersionTXT, this.#artifact.version)
  }

  public async runGenerator(options: GenerateOptions) {
    const { log } = options
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

export interface GenerateOptions {
  readonly log: (...args: unknown[]) => void
}

export default CodeGenerator
