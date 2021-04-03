import { join } from './std/path.ts'
import ROOT from './workspace.ts'
export const SCRIPT_FILE_PATH = join(ROOT, 'main.js')
export const DENO_PERMISSIONS = ['--allow-read', '--allow-write', '--allow-env'] as const
export const DENO_FLAGS = ['--unstable', ...DENO_PERMISSIONS] as const
export const SCRIPT_FLAGS = ['--color', 'never'] as const
export const CACHE_SANE_FMT = [Deno.execPath(), 'cache', ...DENO_FLAGS, SCRIPT_FILE_PATH] as const
export const RUN_SANE_FMT = [Deno.execPath(), 'run', ...DENO_FLAGS, SCRIPT_FILE_PATH, ...SCRIPT_FLAGS] as const
export default RUN_SANE_FMT
