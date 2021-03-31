import { exists } from './std/fs.ts'
import { join } from './std/path.ts'
import download from './download.ts'
import { wasiFileUrl } from './urls.ts'
import ROOT from './workspace.ts'

export class Artifact<Version extends string> {
  constructor(public readonly version: Version) {}
  public readonly url = wasiFileUrl(this.version)
  public readonly name = `sane-fmt@${this.version}.wasm`
  public readonly path = join(ROOT, 'artifacts', this.name)

  public exists() {
    return exists(this.path)
  }

  public async forceDownload() {
    await download(this.url, {
      file: this.path,
    })
  }

  public async downloadOnce() {
    if (await this.exists()) return 'AlreadyExist' as const
    await this.forceDownload()
    return 'Downloaded' as const
  }

  public async runDownloader(options: DownloadOptions) {
    const { overwrite, log } = options
    log(this.version)
    log('  source:', this.url)
    log('  target:', this.path)

    if (overwrite) {
      await this.forceDownload()
      log(`downloaded ${this.version}`)
      return
    }

    log(
      ({
        AlreadyExist: `${this.version} already exists locally`,
        Downloaded: `downloaded ${this.version}`,
      })[await this.downloadOnce()],
    )
  }
}

export interface DownloadOptions {
  readonly overwrite: boolean
  readonly log: (...args: unknown[]) => void
}

export default Artifact
