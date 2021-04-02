import createContext from './context.ts'

/**
 * Run `sane-fmt` wasi program
 * @param blob Code of the `sane-fmt` program
 * @returns Promise that resolves to status code of the `sane-fmt` program
 */
export async function run(blob: Uint8Array): Promise<number | null> {
  const [context, module] = await Promise.all([
    createContext(),
    WebAssembly.compile(blob),
  ])
  const instance = await WebAssembly.instantiate(module, {
    wasi_snapshot_preview1: context.exports,
  })
  return context.start(instance)
}

export default run
