import { args, flags, symbols } from './lib/args.ts'
import { Artifact, DownloadOptions } from './lib/artifacts.ts'

const parser = args
  .with(flags.EarlyExitFlag('help', {
    alias: ['h'],
    describe: 'Show help',
    exit() {
      console.log('DESCRIPTION:')
      console.log('  Download sane-fmt wasi binary and generate related files')
      console.log()
      console.log(parser.help())
      return Deno.exit()
    },
  }))
  .with(flags.BinaryFlag('overwrite', {
    alias: ['f'],
    describe: 'Overwrite over existing binary',
  }))

const res = parser.parse(Deno.args)
if (res.tag !== symbols.MAIN_COMMAND) {
  throw new Error('Failed to parse CLI arguments')
}
const remainingFlags = res.remaining().rawFlags()
if (remainingFlags.length) {
  throw new Error('Unknown flags: ' + remainingFlags.join(', '))
}

const { overwrite } = res.value

const downloadOptions: DownloadOptions = {
  overwrite,
  log: console.error,
}

await Promise.all(
  res.remaining().rawValues()
    .map(version => new Artifact(version))
    .map(artifact => artifact.runDownloader(downloadOptions)),
)