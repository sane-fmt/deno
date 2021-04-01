import { Context, ContextOptions } from './std/wasi.ts'
import preopens from './preopens.ts'

export type DenoInterface = Readonly<
  Pick<
    typeof Deno,
    | 'args'
    | 'env'
    | 'stdin'
    | 'stdout'
    | 'stderr'
  >
>

export const createContextOptions = async (Deno: DenoInterface): Promise<ContextOptions> => ({
  args: ['sane-fmt', ...Deno.args],
  env: Deno.env.toObject(),
  stdin: Deno.stdin.rid,
  stdout: Deno.stdout.rid,
  stderr: Deno.stderr.rid,
  exitOnReturn: true,
  preopens: await preopens(Deno.args),
})

export const createContext = async () => new Context(await createContextOptions(Deno))

export default createContext
