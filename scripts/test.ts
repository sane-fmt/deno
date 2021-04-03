#! /usr/bin/env -S deno test --unstable --allow-all
import { assertStrictEquals, assertEquals, assertNotStrictEquals } from '../utils/std/testing/asserts.ts'
import preopensEnv from '../utils/path-like-env.ts'
import SANE_FMT_CMD from '../utils/sane-fmt-cmd.ts'
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

Deno.test('preopens([--include <filename>]) returns <filename>', async () => {
  await initTestEnvironment(root)
  assertEquals(await preopens(['--include', 'include/include.txt']), { 'include': 'include' })
})

Deno.test('preopens([], <env>) returns <env> and current directory', async () => {
  await initTestEnvironment(root)
  const actual = await preopens([], preopensEnv('foo', 'bar', 'baz'))
  const expected = { '.': '.', 'foo': 'foo', 'bar': 'bar', 'baz': 'baz' }
  assertEquals(actual, expected)
})

Deno.test('preopens(<list>, <env>) includes <env> in the result', async () => {
  await initTestEnvironment(root)
  const actual = await preopens(['dir/file.ts', 'dir/not-exist'], preopensEnv('foo', 'bar', 'baz'))
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

interface RunSaneFmtOptions {
  readonly env?: Record<string, string>
  readonly stdin?: string
}

async function runSaneFmt(args: readonly string[], options: RunSaneFmtOptions = {}) {
  const { env, stdin } = options
  const process = Deno.run({
    cmd: [...SANE_FMT_CMD, ...args],
    env: Object.assign(Deno.env.toObject(), env),
    stdin: stdin === undefined ? 'null' : 'piped',
    stdout: 'piped',
    stderr: 'piped',
  })
  if (stdin !== undefined) {
    const textEncoder = new TextEncoder()
    await process.stdin!.write(textEncoder.encode(stdin))
    process.stdin!.close()
  }
  const textDecoder = new TextDecoder()
  const status = await process.status()
  const stdout = textDecoder.decode(await process.output()).trim()
  const stderr = textDecoder.decode(await process.stderrOutput()).trim()
  process.close()
  return { status, stdout, stderr }
}

Deno.test('use sane-fmt to check correctly formatted files', async () => {
  await initTestEnvironment(root)
  const output = await runSaneFmt(['correct-formatting'])
  assertStrictEquals(output.status.success, true)
  assertStrictEquals(output.stderr, '')
})

Deno.test('use sane-fmt to check incorrectly formatted files', async () => {
  await initTestEnvironment(root)
  const output = await runSaneFmt(['incorrect-formatting'])
  assertStrictEquals(output.status.success, false)
  assertNotStrictEquals(output.stderr, '')
})

Deno.test('use sane-fmt to reformatted incorrectly formatted files', async () => {
  await initTestEnvironment(root)
  const writeOutput = await runSaneFmt(['--write', 'incorrect-formatting'])
  assertStrictEquals(writeOutput.status.success, true)
  assertStrictEquals(writeOutput.stderr, '')
  const checkOutput = await runSaneFmt(['incorrect-formatting'])
  assertStrictEquals(checkOutput.status.success, true)
  assertStrictEquals(checkOutput.stderr, '')
})

Deno.test('use sane-fmt with --include and $SANE_FMT_DENO_PREOPENS', async () => {
  await initTestEnvironment(root)
  const output = await runSaneFmt(['--include=include/include.txt'], {
    env: {
      SANE_FMT_DENO_PREOPENS: preopensEnv('include', 'correct-formatting', 'incorrect-formatting'),
    },
  })
  assertStrictEquals(output.status.success, false)
  assertStrictEquals(output.stderr, 'Error: "There are 1 unformatted files"')
})

Deno.test('use sane-fmt with --include - and $SANE_FMT_DENO_PREOPENS', async () => {
  await initTestEnvironment(root)
  const output = await runSaneFmt(['--include', '-'], {
    env: {
      SANE_FMT_DENO_PREOPENS: preopensEnv('correct-formatting'),
    },
    stdin: 'correct-formatting\n',
  })
  assertStrictEquals(output.status.success, true)
  assertStrictEquals(output.stderr, '')
})

Deno.test('use sane-fmt with --include=- and $SANE_FMT_DENO_PREOPENS', async () => {
  await initTestEnvironment(root)
  const output = await runSaneFmt(['--include=-'], {
    env: {
      SANE_FMT_DENO_PREOPENS: preopensEnv('correct-formatting'),
    },
    stdin: 'correct-formatting\n',
  })
  assertStrictEquals(output.status.success, true)
  assertStrictEquals(output.stderr, '')
})

Deno.test('use sane-fmt with --stdio', async () => {
  await initTestEnvironment(root)
  const input = 'export const hello = "world";'
  const output1 = await runSaneFmt(['--stdio'], { stdin: input })
  assertStrictEquals(output1.status.success, true)
  assertNotStrictEquals(output1.stdout, '')
  assertNotStrictEquals(output1.stdout, input)
  assertStrictEquals(output1.stderr, '')
  const output2 = await runSaneFmt(['--stdio'], { stdin: output1.stdout })
  assertStrictEquals(output2.status.success, true)
  assertNotStrictEquals(output2.stdout, '')
  assertStrictEquals(output2.stdout, output1.stdout)
  assertStrictEquals(output2.stderr, '')
})
