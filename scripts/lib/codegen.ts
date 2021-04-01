import { encode } from './std/encoding/base64.ts'
import { join } from './std/path.ts'
import Artifact from './artifact.ts'
import ROOT from './workspace.ts'

export const code = (base64: string): string =>
  [
    '// sane-fmt-ignore',
    `export const base64 = '${base64}'`,
    'export default base64',
    '',
  ].join('\n')

export class CodeGenerator<Version extends string> {
  #artifact: Artifact<Version>

  constructor(artifact: Artifact<Version>) {
    this.#artifact = artifact
  }

  public readonly path = join(ROOT, 'lib', 'base64.ts')

  public async generate() {
    const data = await Deno
      .readFile(this.#artifact.path)
      .then(encode)
      .then(code)

    await Deno.writeTextFile(this.path, data)
  }

  public async runGenerator(options: GenerateOptions) {
    const { log } = options
    log(`generating ${this.path}...`)
    await this.generate()
    log('done.')
  }
}

export interface GenerateOptions {
  readonly log: (...args: unknown[]) => void
}

export default CodeGenerator
