import { ensureFile } from './std/fs.ts'
import { join } from './std/path.ts'

type Directory = {
  readonly [path: string]: File | Directory
}

type File = string

export type FileSystemTree = File | Directory

export async function buildFileSystemTree(tree: FileSystemTree, ...prefix: string[]) {
  switch (typeof tree) {
    case 'object':
      await Promise.all(
        Object
          .entries(tree)
          .map(([path, content]) => buildFileSystemTree(content, ...prefix, path)),
      )
      return
    case 'string': {
      const filename = join(...prefix)
      await ensureFile(filename)
      await Deno.writeTextFile(filename, tree)
      return
    }
    default:
      throw new TypeError(`Unexpected type: ${typeof tree}`)
  }
}

export default buildFileSystemTree
