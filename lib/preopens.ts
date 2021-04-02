import { dirname, SEP } from './std/path.ts'
import xArgs, { symbols, flags } from './x/args.ts'

function getTargetFiles(args: readonly string[]) {
  const res = xArgs
    .with(flags.BinaryFlag('help', { alias: ['h'] }))
    .with(flags.BinaryFlag('version', { alias: ['V'] }))
    .with(flags.BinaryFlag('stdio'))
    .parse(args)

  if (res.tag !== symbols.MAIN_COMMAND) {
    throw new Error('Something goes wrong.')
  }

  // when the following flags present, sane-fmt won't touch the filesystem,
  // preopens become an unnecessary burden on performance
  const { help, version, stdio } = res.value
  if (help || version || stdio) return null

  return res.remaining().rawValues()
}

function parsePreopensEnv(env = ''): Record<string, string> {
  const entries = env.split(SEP).map(path => [path, path])
  return Object.fromEntries(entries)
}

export async function preopens(args: readonly string[], env?: string): Promise<Record<string, string>> {
  const preopens: Record<string, string> = parsePreopensEnv(env)

  const targetFiles = getTargetFiles(args)
  if (!targetFiles) return preopens

  const directories = await Promise.all(
    targetFiles.map(async name => {
      try {
        const stats = await Deno.lstat(name)
        return stats.isDirectory ? name : dirname(name)
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          return name
        }
        throw error
      }
    }),
  )

  for (const name of directories) {
    preopens[name] = name
  }

  preopens['.'] = '.'

  return preopens
}

export default preopens
