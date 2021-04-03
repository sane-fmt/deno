import { SEP } from './std/path.ts'

export type AbsoluteURL = `file:///${string}`
export const isAbsolute = (url: string): url is AbsoluteURL => url.startsWith('file:///')

const PROTOCOL_REGEX = /^file:\/\//
const WINDOWS_PREFIX_REGEX = /^file:\/\/\/(?<drive>[A-Z]+):/

export const isWindowsAbsolute = (url: string) => WINDOWS_PREFIX_REGEX.test(url)

export function assertAbsolute(url: string): AbsoluteURL {
  if (isAbsolute(url)) return url
  throw new RangeError(`URL is not absolute: ${url}`)
}

export function getAbsolutePath(url: AbsoluteURL) {
  const matches = url.match(WINDOWS_PREFIX_REGEX)
  if (!matches) {
    return url.replace(PROTOCOL_REGEX, '').replaceAll('/', SEP)
  }
  const [prefix, drive] = matches
  const suffix = url.slice(prefix.length).replaceAll('/', SEP)
  return drive + ':' + suffix
}

export default getAbsolutePath
