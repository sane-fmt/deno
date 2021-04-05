#! /usr/bin/env -S deno run --unstable --allow-all
import { join } from '../utils/std/path.ts'
import { args, EarlyExitFlag, Option, Text, PARSE_FAILURE } from '../utils/x/args.ts'
import getCliUsage from '../utils/cli-usage.ts'
import CodeGenerator from '../utils/codegen.ts'
import applyTemplate from '../utils/template.ts'
import ROOT from '../utils/workspace.ts'

const parser = args
  .describe('Download sane-fmt wasi binary and generate related files')
  .with(EarlyExitFlag('help', {
    alias: ['h'],
    describe: 'Show help',
    exit() {
      console.log('USAGE:')
      console.log('  ./scripts/generate.ts [OPTIONS]')
      console.log(parser.help())
      return Deno.exit()
    },
  }))
  .with(Option('description', {
    type: Text,
    describe: 'Description of sane-fmt',
  }))
  .with(Option('tag', {
    type: Text,
    describe: 'Version of sane-fmt',
  }))
  .with(Option('filename', {
    type: Text,
    describe: 'Path to the sane-fmt WASI binary',
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

const { description, tag, filename } = res.value

const remainingValues = res.remaining().rawValues()
if (remainingValues.length) {
  console.error('Excessive arguments', remainingValues)
  throw Deno.exit(1)
}

const generator = new CodeGenerator({
  log: console.error,
  version: tag,
  filename,
})

try {
  await generator.runGenerator()
  const readmeTemplate = await Deno.readTextFile(join(ROOT, 'README_TEMPLATE.md'))
  const readmeContent = applyTemplate(readmeTemplate, {
    VERSION: tag,
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
} catch (error) {
  console.error(error instanceof Error ? error.toString() : error)
  throw Deno.exit(1)
}
