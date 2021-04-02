import { dirname, delimiter } from './std/path.ts'
import xArgs, { symbols, values, flags } from './x/args.ts'

/**
 * Extract names of files and folders from an array of CLI arguments
 * @param args CLI arguments
 * @returns Either `null` or an array
 *   * `null`: When filenames and dirnames are judged to be unnecessary
 *     (i.e. when user asks for `--help` or `--version`)
 *   * an array of names: When filenames and dirnames are necessary
 */
function getTargetFiles(args: readonly string[]) {
  const res = xArgs
    .with(flags.BinaryFlag('help', { alias: ['h'] }))
    .with(flags.BinaryFlag('version', { alias: ['V'] }))
    .with(flags.BinaryFlag('stdio'))
    .with(flags.PartialOption('include', {
      alias: ['I'],
      type: values.Text,
      default: null,
    }))
    .parse(args)

  if (res.tag !== symbols.MAIN_COMMAND) {
    throw new Error('Something goes wrong.')
  }

  // when the following flags present, sane-fmt won't touch the filesystem,
  // preopens become an unnecessary burden on performance
  const { help, version, stdio, include } = res.value
  if (help || version || stdio) return null

  const result = res.remaining().rawValues()
  return include ? [...result, include] : result
}

/**
 * Convert a `PATH`-like string into an object to add to `preopens`
 * @param env Value of `SANE_FMT_DENO_PREOPENS` environment variable
 * @returns Object compatible with `preopens`
 */
function parsePreopensEnv(env?: string): Record<string, string> {
  if (!env) return {}
  const entries = env.split(delimiter).map(path => [path, path])
  return Object.fromEntries(entries)
}

/**
 * Create a `preopens` object
 * @param args CLI arguments
 * @param env Value of `SANE_FMT_DENO_PREOPENS` environment variable
 * @returns Promise that resolves to a `preopens` object
 */
export async function preopens(args: readonly string[], env?: string): Promise<Record<string, string>> {
  const preopens: Record<string, string> = parsePreopensEnv(env)

  const targetFiles = getTargetFiles(args)
  if (!targetFiles) return preopens

  if (!targetFiles.length) return { '.': '.', ...preopens }

  const directories = await Promise.all(
    targetFiles.map(async name => {
      try {
        const stats = await Deno.lstat(name)
        return stats.isDirectory ? name : dirname(name)
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          return null
        }
        throw error
      }
    }),
  )

  for (const name of directories) {
    if (name === null) continue
    preopens[name] = name
  }

  return preopens
}

export default preopens
