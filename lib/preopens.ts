import { dirname } from './std/path.ts'
import xArgs, { symbols } from './x/args.ts'

function argValues(args: readonly string[]) {
  const res = xArgs.parse(args)
  if (res.tag !== symbols.MAIN_COMMAND) {
    throw new Error('Something goes wrong.')
  }
  return res.remaining().rawValues()
}

export async function preopens(args: readonly string[]): Promise<Record<string, string>> {
  const preopens: Record<string, string> = {}

  const directories = await Promise.all(
    argValues(args).map(async name => {
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
