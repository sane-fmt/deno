#! /usr/bin/env -S deno test --unstable --allow-all
import { assertStrictEquals, assertEquals, assertNotStrictEquals } from '../utils/std/testing/asserts.ts'
import { SEP } from '../utils/std/path.ts'
import preopensEnv from '../utils/path-like-env.ts'
import { CACHE_SANE_FMT, RUN_SANE_FMT } from '../utils/sane-fmt-cmd.ts'
import initTestEnvironment from '../utils/test-env.ts'
import {
  PREOPENS_ENV_NAME,
  DEFAULT_WINDOWS_DEVICE_MAPPER,
  WINDOWS_ERROR_MESSAGE,
  preopens,
  fromWindowsPath,
} from '../index.ts'

const root = await Deno.makeTempDir({
  prefix: 'sane-fmt-deno.',
  suffix: '.test-env',
})
Deno.chdir(root)

// cache main.js prematurely to avoid deno littering logs to stderr later on
const cachingStatus = await Deno.run({
  cmd: [...CACHE_SANE_FMT],
  stdin: 'null',
  stdout: 'inherit',
  stderr: 'inherit',
}).status()
if (!cachingStatus.success) {
  console.warn('Warning: Failed to cache main.js prematurely')
  console.warn(cachingStatus)
}

Deno.test('PREOPENS_ENV_NAME', () => {
  assertStrictEquals(PREOPENS_ENV_NAME, 'SANE_FMT_DENO_PREOPENS')
})

Deno.test('DEFAULT_WINDOWS_DEVICE_MAPPER', () => {
  assertStrictEquals(DEFAULT_WINDOWS_DEVICE_MAPPER('C'), '/mnt/C')
})

Deno.test('fromWindowsPath(<absolute>) returns WASI compatible absolute path', () => {
  assertStrictEquals(fromWindowsPath('C:\\User\\USERNAME', DEFAULT_WINDOWS_DEVICE_MAPPER), '/mnt/C/User/USERNAME')
})

Deno.test('fromWindowsPath(<relative>) returns WASI compatible relative path', () => {
  assertStrictEquals(fromWindowsPath('Foo\\Bar\\Baz', DEFAULT_WINDOWS_DEVICE_MAPPER), 'Foo/Bar/Baz')
})

const transformPosixPath = (path: string) => path.replaceAll('/', SEP)
const actualPreopens = (posixPaths: string[], env?: string) => preopens(posixPaths.map(transformPosixPath), env)
const expectedPreopens = (...posixPaths: string[]) =>
  Object.fromEntries(posixPaths.map(path => [path, transformPosixPath(path)]))

Deno.test('preopens([]) returns only current directory', async () => {
  assertEquals(await actualPreopens([]), expectedPreopens('.'))
})

Deno.test('preopens([<filename>]) returns only dirname(<filename>)', async () => {
  await initTestEnvironment(root)
  assertEquals(await actualPreopens(['dir/dir/file.ts']), expectedPreopens('dir/dir'))
})

Deno.test('preopens([<dirname>]) returns only <dirname>', async () => {
  await initTestEnvironment(root)
  assertEquals(await actualPreopens(['dir/dir']), expectedPreopens('dir/dir'))
})

Deno.test('preopens ignores names that do not exist', async () => {
  await initTestEnvironment(root)
  assertEquals(await actualPreopens(['dir/file.ts', 'dir/not-exist']), expectedPreopens('dir'))
})

Deno.test('preopens([--include <filename>]) returns <filename>', async () => {
  await initTestEnvironment(root)
  assertEquals(await actualPreopens(['--include', 'include/include.txt']), expectedPreopens('include'))
})

Deno.test('preopens([], <env>) returns <env> and current directory', async () => {
  await initTestEnvironment(root)
  const actual = await actualPreopens([], preopensEnv('foo', 'bar', 'baz'))
  const expected = expectedPreopens('.', 'foo', 'bar', 'baz')
  assertEquals(actual, expected)
})

Deno.test('preopens(<list>, <env>) includes <env> in the result', async () => {
  await initTestEnvironment(root)
  const actual = await actualPreopens(['dir/file.ts', 'dir/not-exist'], preopensEnv('foo', 'bar', 'baz'))
  const expected = expectedPreopens('dir', 'foo', 'bar', 'baz')
  assertEquals(actual, expected)
})

Deno.test('preopens(--help|-h|--version|-V|--stdio) returns an empty object', async () => {
  const flags = ['--help', '-h', '--version', '-V', '--stdio']
  const entry = <Value>(flag: string, value: Value) => ({ flag, value })
  const actual = await Promise.all(flags.map(async flag => entry(flag, await actualPreopens([flag]))))
  const expected = flags.map(flag => entry(flag, {}))
  assertEquals(actual, expected)
})

Deno.test('preopens(--help|-h|--version|-V|--stdio) returns an empty object regardless of other targets', async () => {
  const flags = ['--help', '-h', '--version', '-V', '--stdio']
  const entry = <Value>(flag: string, value: Value) => ({ flag, value })
  const actual = await Promise.all(flags.map(async flag => entry(flag, await actualPreopens(['foo', flag, 'bar']))))
  const expected = flags.map(flag => entry(flag, {}))
  assertEquals(actual, expected)
})

Deno.test('preopens(--help|-h|--version|-V|--stdio, <env>) respects <env>', async () => {
  await Promise.all(['foo', 'bar', 'baz'].map(suffix => initTestEnvironment(root, suffix)))
  const flags = ['--help', '-h', '--version', '-V', '--stdio']
  const entry = <Value>(flag: string, value: Value) => ({ flag, value })
  const env = preopensEnv('foo', 'bar', 'baz')
  const actual = await Promise.all(flags.map(async flag => entry(flag, await actualPreopens([flag], env))))
  const expected = flags.map(flag => entry(flag, expectedPreopens('foo', 'bar', 'baz')))
  assertEquals(actual, expected)
})

interface RunSaneFmtOptions {
  readonly env?: Record<string, string>
  readonly stdin?: string
}

async function runSaneFmt(args: readonly string[], options: RunSaneFmtOptions = {}) {
  const { env, stdin } = options
  const process = Deno.run({
    cmd: [...RUN_SANE_FMT, ...args],
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

type TestCaller = (name: string, fn: () => void | Promise<void>) => void
const isWindows = Deno.build.os === 'windows'
const isPOSIX = Deno.build.os === 'linux' || Deno.build.os === 'darwin'
const testWindows: TestCaller = (name, fn) => Deno.test({ name, fn, ignore: isPOSIX })
const testPOSIX: TestCaller = (name, fn) => Deno.test({ name, fn, ignore: isWindows })

testWindows('main.js does not support Windows', async () => {
  const output = await runSaneFmt([])
  assertStrictEquals(output.status.success, false)
  assertStrictEquals(output.stdout, '')
  assertStrictEquals(output.stderr, WINDOWS_ERROR_MESSAGE)
})

testPOSIX('use sane-fmt to check correctly formatted files', async () => {
  await initTestEnvironment(root)
  const output = await runSaneFmt(['correct-formatting'])
  assertStrictEquals(output.status.success, true)
  assertStrictEquals(output.stderr, '')
})

testPOSIX('use sane-fmt to check incorrectly formatted files', async () => {
  await initTestEnvironment(root)
  const output = await runSaneFmt(['incorrect-formatting'])
  assertStrictEquals(output.status.success, false)
  assertNotStrictEquals(output.stderr, '')
})

testPOSIX('use sane-fmt to reformatted incorrectly formatted files', async () => {
  await initTestEnvironment(root)
  const writeOutput = await runSaneFmt(['--write', 'incorrect-formatting'])
  assertStrictEquals(writeOutput.status.success, true)
  assertStrictEquals(writeOutput.stderr, '')
  const checkOutput = await runSaneFmt(['incorrect-formatting'])
  assertStrictEquals(checkOutput.status.success, true)
  assertStrictEquals(checkOutput.stderr, '')
})

testPOSIX('use sane-fmt with --include and $SANE_FMT_DENO_PREOPENS', async () => {
  await initTestEnvironment(root)
  const output = await runSaneFmt([`--include=include${SEP}include.txt`], {
    env: {
      SANE_FMT_DENO_PREOPENS: preopensEnv('include', 'correct-formatting', 'incorrect-formatting'),
    },
  })
  assertStrictEquals(output.status.success, false)
  assertStrictEquals(output.stderr, 'Error: "There are 1 unformatted files"')
})

testPOSIX('use sane-fmt with --include - and $SANE_FMT_DENO_PREOPENS', async () => {
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

testPOSIX('use sane-fmt with --include=- and $SANE_FMT_DENO_PREOPENS', async () => {
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

testPOSIX('use sane-fmt with --stdio', async () => {
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
