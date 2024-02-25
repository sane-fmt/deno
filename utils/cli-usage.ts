import { join } from './std/path.ts'
import ROOT from './workspace.ts'
import stripAnsi from './x/strip-ansi.ts'

export async function getCliUsage(flag: '--help' | '-h'): Promise<string> {
  const process = Deno.run({
    cmd: [Deno.execPath(), 'run', '--unstable', '--allow-env', join(ROOT, 'main.js'), flag],
    stdin: 'null',
    stdout: 'piped',
    stderr: 'inherit',
  })

  const status = await process.status()
  if (!status.success) {
    throw new Error(`Command "sane-fmt ${flag}" exits with code ${status.code}`)
  }

  const cliUsageAnsi = new TextDecoder()
    .decode(await process.output())
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')

  return stripAnsi(cliUsageAnsi)
}

export default getCliUsage
