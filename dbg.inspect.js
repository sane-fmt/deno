#! /usr/bin/env -S deno run --unstable --allow-all
import Context from 'https://deno.land/std@0.91.0/wasi/snapshot_preview1.ts'
import { u8v } from './index.ts'
const context = new Context({
  args: ['sane-fmt', 'main.js', 'index.ts', 'lib/main.js', 'lib/index.ts', 'lib/x', 'lib/std'],
  stdin: Deno.stdin.rid,
  stdout: Deno.stdout.rid,
  stderr: Deno.stderr.rid,
  preopens: {
    '.': '.',
  },
})
const module = await WebAssembly.compile(u8v)
const instance = await WebAssembly.instantiate(module, {
  wasi_snapshot_preview1: context.exports,
})
const status = context.start(instance)
if (status) {
  throw new Error(`Program exits with code ${status}`)
}
