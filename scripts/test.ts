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

Deno.test('preopens ignores names that do not exist', async () => {
  await initTestEnvironment(root)
  assertEquals(await preopens(['dir/file.ts', 'dir/not-exist']), { 'dir': 'dir' })
})

Deno.test('preopens([], <env>) returns <env> and current directory', async () => {
  await initTestEnvironment(root)
  const actual = await preopens([], 'foo:bar:baz')
  const expected = { '.': '.', 'foo': 'foo', 'bar': 'bar', 'baz': 'baz' }
  assertEquals(actual, expected)
})

Deno.test('preopens(<list>, <env>) includes <env> in the result', async () => {
  await initTestEnvironment(root)
  const actual = await preopens(['dir/file.ts', 'dir/not-exist'], 'foo:bar:baz')
  const expected = { 'dir': 'dir', 'foo': 'foo', 'bar': 'bar', 'baz': 'baz' }
  assertEquals(actual, expected)
})

Deno.test('preopens(--help|-h|--version|-V|--stdio) returns an empty object', async () => {
  const flags = ['--help', '-h', '--version', '-V', '--stdio']
  const entry = <Value>(flag: string, value: Value) => ({ flag, value })
  const actual = await Promise.all(flags.map(async flag => entry(flag, await preopens([flag]))))
  const expected = flags.map(flag => entry(flag, {}))
  assertEquals(actual, expected)
})

Deno.test('preopens(--help|-h|--version|-V|--stdio) returns an empty object regardless of other targets', async () => {
  const flags = ['--help', '-h', '--version', '-V', '--stdio']
  const entry = <Value>(flag: string, value: Value) => ({ flag, value })
  const actual = await Promise.all(flags.map(async flag => entry(flag, await preopens(['foo', flag, 'bar']))))
  const expected = flags.map(flag => entry(flag, {}))
  assertEquals(actual, expected)
})

Deno.test('preopens(--help|-h|--version|-V|--stdio, <env>) respects <env>', async () => {
  await Promise.all(['foo', 'bar', 'baz'].map(suffix => initTestEnvironment(root, suffix)))
  const flags = ['--help', '-h', '--version', '-V', '--stdio']
  const entry = <Value>(flag: string, value: Value) => ({ flag, value })
  const actual = await Promise.all(flags.map(async flag => entry(flag, await preopens([flag], 'foo:bar:baz'))))
  const expected = flags.map(flag => entry(flag, { 'foo': 'foo', 'bar': 'bar', 'baz': 'baz' }))
  assertEquals(actual, expected)
})
