import { join } from './std/path.ts'
import download from './x/download.ts'
import { wasiFileUrl } from './urls.ts'
import ROOT from './workspace.ts'

export class Artifact<Version extends string> {
  constructor(public readonly version: Version) {}
  public readonly url = wasiFileUrl(this.version)
  public readonly name = `sane-fmt@${this.version}.wasm`
  public readonly dir = join(ROOT, 'artifacts')
  public readonly path = join(ROOT, 'artifacts', this.name)

  public exists() {
    return Deno.lstat(this.path).then(
      stats => {
        if (stats.isFile) return true
        console.error(stats)
        throw new Error(`${this.path} is not a file`)
      },
      error => {
        if (error instanceof Deno.errors.NotFound) return true
        throw error
      },
    )
  }

  public async forceDownload() {
    await download(this.url, {
      dir: this.dir,
      file: this.name,
    }, {
      redirect: 'follow',
    })
  }

  public async downloadOnce() {
    if (await this.exists()) return 'AlreadyExist' as const
    await this.forceDownload()
    return 'Downloaded' as const
  }

  public async runDownloader(options: DownloadOptions) {
    const { overwrite, log } = options
    log('source:', this.url)
    log('target:', this.path)

    if (overwrite) {
      await this.forceDownload()
      log('done.')
      return
    }

    log(
      ({
        AlreadyExist: 'already exists.',
        Downloaded: 'done.',
      })[await this.downloadOnce()],
    )
  }
}

export interface DownloadOptions {
  readonly overwrite: boolean
  readonly log: (...args: unknown[]) => void
}

export default Artifact
