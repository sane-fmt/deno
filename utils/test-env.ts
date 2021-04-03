import { ensureFile } from './std/fs.ts'
import { join } from './std/path.ts'
import buildFileSystemTree from './fs-tree.ts'

export async function initTestEnvironment(...root: string[]) {
  await buildFileSystemTree({
    'dir/dir/dir/file.ts': '',
    'dir/dir/file.ts': '',
    'dir/file.ts': '',
    'file.ts': '',
    'include/include.txt': [
      'dir/dir',
      'dir/file.ts',
    ].join('\n'),
  }, ...root)
}

export default initTestEnvironment
