import { join, dirname } from './std/path.ts'
import { getDirname } from './cjs.ts'
import { pipe } from './compose.ts'

export const ROOT = pipe(
  import.meta.url,
  getDirname,
  dirname,
  dirname,
)

export default ROOT
