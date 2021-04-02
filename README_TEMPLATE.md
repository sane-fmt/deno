# sane-fmt

{DESCRIPTION}

* Main Repo: [sane-fmt/sane-fmt](https://github.com/sane-fmt/sane-fmt)
  * [Issues](https://github.com/sane-fmt/sane-fmt/issues)
* Version: {VERSION}
  - [GitHub Release](https://github.com/sane-fmt/sane-fmt/releases/tag/{VERSION})
  - [Deno Page](https://deno.land/x/sane_fmt@{VERSION})

## Usage in Deno

* `Deno.version.deno`: {DENO_VERSION}
* `Deno.version.v8`: {V8_VERSION}
* `Deno.version.typescript`: {TYPESCRIPT_VERSION}

### Command Line Interface

#### Installation

```sh
deno install \
  --unstable \
  --allow-read \
  --allow-write \
  --allow-env \
  --name=sane-fmt \
  https://deno.land/x/sane_fmt@{VERSION}/main.js
```

#### CLI Usage

**Environment Variables:**

* `SANE_FMT_DENO_PREOPENS`: A list of preopened directories. Its delimiter is colon (`:`) on Linux/Unix and semicolon (`;`) in Windows.

**Usage:**

```
{CLI_USAGE}
```

### Programming Interface

* [/x/sane_fmt](https://deno.land/x/sane_fmt@{VERSION}/index.ts)
* [API Reference](https://doc.deno.land/https/deno.land//x/sane_fmt@{VERSION}/index.ts)

#### Example: Format a file

```javascript
import Context from 'https://deno.land/std@0.91.0/wasi/snapshot_preview1.ts'
import { u8v } from 'https://deno.land/x/sane_fmt@{VERSION}/index.ts'
const context = new Context({
  args: ['sane-fmt', 'example-directory/example-file.ts'],
  stdin: Deno.stdin.rid,
  stdout: Deno.stdout.rid,
  stderr: Deno.stderr.rid,
  preopens: {
    'example-directory': 'example-directory',
  },
})
const module = await WebAssembly.compile(u8v)
const instance = await WebAssembly.instantiate(module, {
  wasi_snapshot_preview1: context.exports,
})
const status = context.start(instance)
if (status === null) {
  throw new Error('Failed to execute sane-fmt')
}
if (status !== 0) {
  throw new Error(`Program exits with code ${status}`)
}
```

#### Example: Read unformatted input and print formatted output

```javascript
import Context from 'https://deno.land/std@0.91.0/wasi/snapshot_preview1.ts'
import { u8v } from 'https://deno.land/x/sane_fmt@{VERSION}/index.ts'
const context = new Context({
  args: ['sane-fmt', '--stdio'],
  stdin: Deno.stdin.rid,
  stdout: Deno.stdout.rid,
  stderr: Deno.stderr.rid,
})
const module = await WebAssembly.compile(u8v)
const instance = await WebAssembly.instantiate(module, {
  wasi_snapshot_preview1: context.exports,
})
const status = context.start(instance)
if (status === null) {
  throw new Error('Failed to execute sane-fmt')
}
if (status !== 0) {
  throw new Error(`Program exits with code ${status}`)
}
```

## License

[MIT](https://git.io/JY6mh) © [Hoàng Văn Khải](https://ksxgithub.github.io/)
