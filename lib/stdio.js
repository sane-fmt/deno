#! /usr/bin/env -S deno run --unstable
import Context from './std/wasi.ts'
import { args, PARSE_FAILURE, MAIN_COMMAND } from './x/args.ts'
import u8v from './u8v.ts'

const parser = args
  .describe('Read input code from stdin, print formatted code to stdout')
  .sub('help', args.describe('Show help'))
  .sub('version', args.describe('Show version'))

const res = parser.parse(Deno.args)

function help(log) {
  log(parser.help())
}

async function version() {
  const context = new Context({
    args: ['sane-fmt', '--version'],
    stdout: Deno.stdout.rid,
  })
  const module = await WebAssembly.compile(u8v)
  const instance = await WebAssembly.instantiate(module, {
    wasi_snapshot_preview1: context.exports,
  })
  return Deno.exit(context.start(instance) || 0)
}

function error(error) {
  console.error('error: ' + error)
  console.error()
  help(console.error)
}

switch (res.tag) {
  case 'help':
    help(console.info)
    throw Deno.exit(0)
  case 'version':
    throw await version()
  case PARSE_FAILURE:
    error(res.error.toString())
    throw Deno.exit(1)
  case MAIN_COMMAND:
    break
  default:
    throw new Error(`Unhandled subcommand: ${res.tag}`)
}

const unwantedFlags = res.remaining().rawFlags()
if (unwantedFlags.length) {
  console.error('error: Unrecognized flags:', unwantedFlags.join(', '))
  console.error()
  help(console.error)
  throw Deno.exit(1)
}

const unwantedArguments = res.remaining().rawValues()
if (unwantedArguments.length) {
  console.error('error: Unwanted arguments:', unwantedArguments.join(', '))
  console.error()
  help(console.error)
  throw Deno.exit(1)
}

const context = new Context({
  args: ['sane-fmt', '--stdio'],
  stdin: Deno.stdin.rid,
  stdout: Deno.stdout.rid,
  stderr: Deno.stderr.rid,
})

const module = await WebAssembly.compile(u8v)
const instance = await WebAssembly.instantiate(module, {
  wasi_snapshot_preview1: context.exports,
})
throw Deno.exit(context.start(instance) || 0)
