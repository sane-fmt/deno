import base64 from './base64.js'

/** Code of the `sane-fmt` program */
export const u8v = Uint8Array.from(atob(base64), x => x.charCodeAt(0))

export default u8v
