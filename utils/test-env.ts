import { ensureFile } from './std/fs.ts'
import { join } from './std/path.ts'

export async function initTestEnvironment(...root: string[]) {
  await Promise.all(
    [
      'dir/dir/dir/file.ts',
      'dir/dir/file.ts',
      'dir/file.ts',
      'file.ts',
    ].map(path => ensureFile(join(...root, path))),
  )
}

export default initTestEnvironment
