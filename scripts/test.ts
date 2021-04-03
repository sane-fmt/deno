#! /usr/bin/env -S deno test --unstable --allow-all
import { assertStrictEquals, assertEquals } from '../utils/std/testing/asserts.ts'
import initTestEnvironment from '../utils/test-env.ts'
import { PREOPENS_ENV_NAME, preopens } from '../index.ts'

const root = await Deno.makeTempDir({
  prefix: 'sane-fmt-deno.',
  suffix: '.test-env',
})
Deno.chdir(root)

Deno.test('PREOPENS_ENV_NAME', () => {
  assertStrictEquals(PREOPENS_ENV_NAME, 'SANE_FMT_DENO_PREOPENS')
})

Deno.test('preopens([]) returns only current directory', async () => {
  assertEquals(await preopens([]), { '.': '.' })
})

Deno.test('preopens([<filename>]) returns only dirname(<filename>)', async () => {
  await initTestEnvironment(root)
  assertEquals(await preopens(['dir/dir/file.ts']), { 'dir/dir': 'dir/dir' })
})

Deno.test('preopens([<dirname>]) returns only <dirname>', async () => {
  await initTestEnvironment(root)
  assertEquals(await preopens(['dir/dir']), { 'dir/dir': 'dir/dir' })
})
