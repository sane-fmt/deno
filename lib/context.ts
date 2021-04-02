import { Context, ContextOptions } from './std/wasi.ts'
import preopens from './preopens.ts'

/** Partial `Deno`-like APIs */
export type DenoAPIs = Readonly<
  Pick<
    typeof Deno,
    | 'args'
    | 'env'
    | 'stdin'
    | 'stdout'
    | 'stderr'
  >
>

/**
 * Name of the environment variable that forces `preopens`.
 * It uses `PATH`-like syntax.
 */
export const PREOPENS_ENV_NAME = 'SANE_FMT_DENO_PREOPENS'

/**
 * Create an object of options necessary to create a wasi `Context`
 * @param Deno Necessary `Deno`-like APIs
 * @returns An object of options
 */
export const createContextOptions = async (Deno: DenoAPIs): Promise<ContextOptions> => ({
  args: ['sane-fmt', ...Deno.args],
  env: Deno.env.toObject(),
  stdin: Deno.stdin.rid,
  stdout: Deno.stdout.rid,
  stderr: Deno.stderr.rid,
  exitOnReturn: true,
  preopens: await preopens(Deno.args, Deno.env.get(PREOPENS_ENV_NAME)),
})

/**
 * Create a wasi `Context` whose `exports` can be imported by
 * the `sane-fmt` program
 * @returns
 */
export const createContext = async () => new Context(await createContextOptions(Deno))

export default createContext
