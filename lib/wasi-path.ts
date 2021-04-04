import { isWindows } from './std/_util/os.ts'

const UPPERCASE_ALPHABET = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'Path',
  'Y',
  'Z',
] as const

/** Type of all uppercase alphabet letters */
export type UppercaseAlphabet = typeof UPPERCASE_ALPHABET[number]

/**
 * Functions resolve a WASI compatible path prefix from a Windows device letter
 * @template WasiPathPrefix Return type
 */
export interface WindowsDeviceMapper<WasiPathPrefix extends string> {
  /**
   * @param device Windows device letter
   * @returns WASI compatible path prefix
   */
  (device: UppercaseAlphabet): WasiPathPrefix
}

/** Default device mapper to use */
export const DEFAULT_WINDOWS_DEVICE_MAPPER: WindowsDeviceMapper<`/mnt/${UppercaseAlphabet}`> = device =>
  `/mnt/${device}` as const

/**
 * Convert a Windows path to a WASI compatible path
 * @template WasiAbsolutePathPrefix Return type of `getAbsolutePrefix`
 * @param path Windows path
 * @param getAbsolutePrefix Function that resolves a WASI compatible path prefix from a Windows device letter
 * @returns WASI compatible path
 */
export function fromWindowsPath<WasiAbsolutePathPrefix extends string>(
  path: string,
  getAbsolutePrefix: WindowsDeviceMapper<WasiAbsolutePathPrefix>,
): string {
  const [letter, colon, backSlash] = path
  if (colon === ':' && backSlash === '\\' && UPPERCASE_ALPHABET.includes(letter as UppercaseAlphabet)) {
    const prefix = getAbsolutePrefix(letter as UppercaseAlphabet)
    const suffix = path.slice(3).replaceAll('\\', '/')
    return `${prefix}/${suffix}` as const
  } else {
    return path.replaceAll('\\', '/')
  }
}

/**
 * Convert a POSIX path to a WASI compatible path
 * @template Path Type of both input and output
 * @param path POSIX path
 * @returns WASI compatible path
 */
export const fromPosixPath = <Path extends string>(path: Path) => path

/** Convert a POSIX or Windows path to a WASI compatible path */
export const fromWindowsPosixPath = isWindows ? fromWindowsPath : fromPosixPath

interface PathConverter {
  /**
   * Convert a Windows/POSIX path to a WASI compatible path
   * @param path Windows/POSIX path
   * @param getAbsolutePrefixForWindows Define absolute path prefix should the host machine is Windows
   * @returns WASI compatible path
   */
  (path: string, getAbsolutePrefixForWindows?: WindowsDeviceMapper<string>): string
}

/** Convert a POSIX or Windows path to a WASI compatible path */
export const getWasiPath: PathConverter = isWindows
  ? (path, prefix = DEFAULT_WINDOWS_DEVICE_MAPPER) => fromWindowsPath(path, prefix)
  : fromPosixPath

export default getWasiPath
