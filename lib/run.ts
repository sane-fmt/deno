import createContext from './context.ts'

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
