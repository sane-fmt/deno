#! /usr/bin/env -S deno run --allow-all
import { WINDOWS_ERROR_MESSAGE, u8v, run } from './index.ts'
if (Deno.build.os === 'windows') {
  console.error(WINDOWS_ERROR_MESSAGE)
  throw Deno.exit(1)
}
const status = await run(u8v)
Deno.exit(status || 0)
