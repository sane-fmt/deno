import { join } from './std/path.ts'
import ROOT from './workspace.ts'
export const SCRIPT_FILE_PATH = join(ROOT, 'stdio.js')
export const CACHE_STDIO = [Deno.execPath(), 'cache', SCRIPT_FILE_PATH] as const
export const RUN_STDIO = [Deno.execPath(), 'run', SCRIPT_FILE_PATH] as const
export default RUN_STDIO
