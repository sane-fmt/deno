const REPO = 'https://github.com/sane-fmt/sane-fmt'
const WASI_FILE_NAME = 'sane-fmt-wasm32-wasi.wasm'
export const repo = (): typeof REPO => REPO
export const releasePrefix = () => `${repo()}/releases/download` as const
export const wasiFileName = (): typeof WASI_FILE_NAME => WASI_FILE_NAME
export const wasiFileUrl = (version: string) => `${releasePrefix()}/${version}/${wasiFileName()}` as const
