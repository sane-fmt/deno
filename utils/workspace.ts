import { join, dirname } from './std/path.ts'
import { getDirname } from './x/cjs.ts'
import { pipe } from './x/compose.ts'

export const ROOT = pipe(
  import.meta.url,
  getDirname,
  dirname,
)

export default ROOT
