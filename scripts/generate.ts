#! /usr/bin/env -S deno run --unstable --allow-all
import { join } from './lib/std/path.ts'
import { args, EarlyExitFlag, BinaryFlag, Option, Text, PARSE_FAILURE } from './lib/x/args.ts'
import Artifact from './lib/artifact.ts'
import getCliUsage from './lib/cli-usage.ts'
import CodeGenerator from './lib/codegen.ts'
import applyTemplate from './lib/template.ts'
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
  .with(Option('description', {
    type: Text,
    describe: 'Description of sane-fmt',
  }))

const res = parser.parse(Deno.args)
if (res.tag === PARSE_FAILURE) {
  console.error(res.error.toString())
  throw Deno.exit(1)
}
const remainingFlags = res.remaining().rawFlags()
if (remainingFlags.length) {
  console.error('Unknown flags: ', remainingFlags)
  throw Deno.exit(1)
}

const { overwrite, noCodeGen, description } = res.value

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
    const readmeTemplate = await Deno.readTextFile(join(ROOT, 'README_TEMPLATE.md'))
    const readmeContent = applyTemplate(readmeTemplate, {
      VERSION: targetVersion,
      DESCRIPTION: description,
      CLI_USAGE: await getCliUsage('--help'),
      DENO_VERSION: Deno.version.deno,
      TYPESCRIPT_VERSION: Deno.version.typescript,
      V8_VERSION: Deno.version.v8,
    })
    await Promise.all(
      ['README.md', 'lib/README.md']
        .map(path => join(ROOT, path))
        .map(path => Deno.writeTextFile(path, readmeContent)),
    )
  }
} catch (error) {
  console.error(error instanceof Error ? error.toString() : error)
  throw Deno.exit(1)
}
