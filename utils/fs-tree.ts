import { ensureFile } from './std/fs.ts'
import { join } from './std/path.ts'

export type FileSystemTree = {
  readonly [path: string]: string | FileSystemTree
}

export async function buildFileSystemTree(tree: FileSystemTree, ...prefix: string[]) {
  await Promise.all(
    Object.entries(tree).map(async ([path, content]) => {
      switch (typeof content) {
        case 'object':
          return buildFileSystemTree(content, ...prefix, path)
        case 'string': {
          const filename = join(...prefix, path)
          await ensureFile(filename)
          await Deno.writeTextFile(filename, content)
          return
        }
        default:
          throw new TypeError(`Unexpected type: ${typeof content}`)
      }
    }),
  )
}

export default buildFileSystemTree
