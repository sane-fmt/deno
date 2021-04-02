#! /usr/bin/env -S deno run --unstable --allow-all
import { join } from './lib/std/path.ts'
import { args, EarlyExitFlag, BinaryFlag, MAIN_COMMAND } from './lib/x/args.ts'
import Artifact from './lib/artifact.ts'
import CodeGenerator from './lib/codegen.ts'
import ROOT from './lib/workspace.ts'

const parser = args
  .with(EarlyExitFlag('help', {
    alias: ['h'],
    describe: 'Show help',
    exit() {
      console.log('DESCRIPTION:')
      console.log('  Download sane-fmt wasi binary and generate related files')
      console.log()
      console.log('USAGE:')
      console.log('  ./scripts/generate.ts [OPTIONS] <VERSION>')
      console.log()
      console.log(parser.help())
      return Deno.exit()
    },
  }))
  .with(BinaryFlag('overwrite', {
    alias: ['f'],
    describe: 'Overwrite over existing binary',
  }))
  .with(BinaryFlag('noCodeGen', {
    describe: 'Skip generating code',
  }))

const res = parser.parse(Deno.args)
if (res.tag !== MAIN_COMMAND) {
  throw new Error('Failed to parse CLI arguments')
}
const remainingFlags = res.remaining().rawFlags()
if (remainingFlags.length) {
  console.error('Unknown flags: ', remainingFlags)
  throw Deno.exit(1)
}

const { overwrite, noCodeGen } = res.value

const [targetVersion, ...remainingValues] = res.remaining().rawValues()
if (remainingValues.length) {
  console.error('Excessive arguments', remainingValues)
  throw Deno.exit(1)
}

const artifact = new Artifact(targetVersion)
const generator = new CodeGenerator(artifact)

try {
  await artifact.runDownloader({
    overwrite,
    log: console.error,
  })
  if (noCodeGen) {
    console.error('code generation is skipped.')
  } else {
    await generator.runGenerator({
      log: console.error,
    })
    await Deno.copyFile(
      join(ROOT, 'README.md'),
      join(ROOT, 'lib', 'README.md'),
    )
  }
} catch (error) {
  console.error('message' in error ? error.message : error)
  throw Deno.exit(1)
}
