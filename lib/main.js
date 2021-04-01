#! /usr/bin/env -S deno run --unstable --allow-all
import { u8v, run } from './index.ts'
const status = await run(u8v)
Deno.exit(status || 0)
