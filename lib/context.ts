import { Context, ContextOptions } from './deps.ts'

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

export const createContextOptions = (Deno: DenoInterface): ContextOptions => ({
  args: Deno.args,
  env: Deno.env.toObject(),
  stdin: Deno.stdin.rid,
  stdout: Deno.stdout.rid,
  stderr: Deno.stderr.rid,
  exitOnReturn: true,
})

export const createContext = () => new Context(createContextOptions(Deno))

export default createContext