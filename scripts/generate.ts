#! /usr/bin/env -S deno run --unstable --allow-all
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
  console.error('Unknown flags: ', remainingFlags)
  throw Deno.exit(1)
}

const { overwrite } = res.value

const downloadOptions: DownloadOptions = {
  overwrite,
  log: console.error,
}

const targetVersions = res.remaining().rawValues()
if (!targetVersions.length) {
  console.error(`missing targets`)
  throw Deno.exit(1)
}

const results = await Promise.all(
  targetVersions.map(version => {
    const artifact = new Artifact(version)
    return artifact.runDownloader(downloadOptions).then(
      () => true,
      error => {
        console.error(`${version}: ${error}`)
        return false
      },
    )
  }),
)

const errorCount = results.filter(success => !success).length
if (errorCount) {
  console.error(`${errorCount} errors occurred.`)
  throw Deno.exit(1)
}
