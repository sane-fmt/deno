#! /usr/bin/env -S deno test --unstable --allow-all
import { assertStrictEquals, assertEquals } from '../utils/std/testing/asserts.ts'
import ROOT from '../utils/workspace.ts'
import { PREOPENS_ENV_NAME, preopens } from '../index.ts'

Deno.chdir(ROOT)

Deno.test('PREOPENS_ENV_NAME', () => {
  assertStrictEquals(PREOPENS_ENV_NAME, 'SANE_FMT_DENO_PREOPENS')
})

Deno.test('preopens([]) returns only current directory', async () => {
  assertEquals(await preopens([]), { '.': '.' })
})

Deno.test('preopens([<filename>]) returns only dirname(<filename>)', async () => {
  assertEquals(await preopens(['scripts/test.ts']), { scripts: 'scripts' })
})

Deno.test('preopens([<dirname>]) returns only <dirname>', async () => {
  assertEquals(await preopens(['scripts']), { scripts: 'scripts' })
})
