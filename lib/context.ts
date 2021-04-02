import { Context, ContextOptions } from './std/wasi.ts'
import preopens from './preopens.ts'

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

export const PREOPENS_ENV_NAME = 'SANE_FMT_DENO_PREOPENS'

export const createContextOptions = async (Deno: DenoAPIs): Promise<ContextOptions> => ({
  args: ['sane-fmt', ...Deno.args],
  env: Deno.env.toObject(),
  stdin: Deno.stdin.rid,
  stdout: Deno.stdout.rid,
  stderr: Deno.stderr.rid,
  exitOnReturn: true,
  preopens: await preopens(Deno.args, Deno.env.get(PREOPENS_ENV_NAME)),
})

export const createContext = async () => new Context(await createContextOptions(Deno))

export default createContext
