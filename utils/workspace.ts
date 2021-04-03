import { dirname } from './std/path.ts'
import { pipe } from './x/compose.ts'
import { getAbsolutePath, assertAbsolute } from './file-url.ts'

export const ROOT = pipe(
  import.meta.url,
  assertAbsolute,
  getAbsolutePath,
  dirname,
  dirname,
)

export default ROOT
