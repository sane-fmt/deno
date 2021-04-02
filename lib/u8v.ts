import { decode } from './std/encoding/base64.ts'
import base64 from './base64.js'

/** Code of the `sane-fmt` program */
export const u8v = decode(base64)

export default u8v
