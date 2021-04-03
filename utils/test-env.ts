import { ensureFile } from './std/fs.ts'
import { join } from './std/path.ts'

export async function initTestEnvironment(...root: string[]) {
  const emptyFiles = Promise.all(
    [
      'dir/dir/dir/file.ts',
      'dir/dir/file.ts',
      'dir/file.ts',
      'file.ts',
    ].map(path => ensureFile(join(...root, path))),
  )

  const includePath = join(...root, 'include', 'include.txt')
  const includeContent = [
    'dir/dir',
    'dir/file.ts',
  ].join('\n')
  const include = ensureFile(includePath).then(() => Deno.writeTextFile(includePath, includeContent))

  await Promise.all([emptyFiles, include])
}

export default initTestEnvironment
