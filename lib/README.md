# sane-fmt

Opinionated code formatter for TypeScript and JavaScript.

* Main Repo: [sane-fmt/sane-fmt](https://github.com/sane-fmt/sane-fmt)
  * [Issues](https://github.com/sane-fmt/sane-fmt/issues)
* Version: 0.17.0
  - [GitHub Release](https://github.com/sane-fmt/sane-fmt/releases/tag/0.17.0)
  - [Deno Page](https://deno.land/x/sane_fmt@0.17.0)

## Usage in Deno

* `Deno.version.deno`: 1.8.0
* `Deno.version.v8`: 9.0.257.3
* `Deno.version.typescript`: 4.2.2

### Command Line Interface

#### [Main CLI](https://deno.land/x/sane_fmt@0.17.0/main.js)

> ⚠ WARNING: Due to technical limitations, the main CLI currently does not support Windows. You may download the native version from [the GitHub Release page of sane-fmt](https://github.com/sane-fmt/sane-fmt/releases). [The stdio CLI](#stdio-cli) is still supported.

**Installation:**

```sh
deno install \
  --unstable \
  --allow-read \
  --allow-write \
  --allow-env \
  --name=sane-fmt \
  https://deno.land/x/sane_fmt@0.17.0/main.js
```

**Environment Variables:**

* `SANE_FMT_DENO_PREOPENS`: A list of preopened directories. Its delimiter is colon (`:`) on Linux/Unix and semicolon (`;`) in Windows.

**Usage:**

```
Opinionated code formatter for TypeScript and JavaScript

Usage: sane-fmt [OPTIONS] [FILES]...

Arguments:
  [FILES]...
          Files to process

          If none are provided, a default set of files will be assumed

Options:
      --stdio
          Reads unformatted code from standard input, prints formatted code to standard output, then exits

  -w, --write
          Whether to write or check

      --details <DETAILS>
          File diff detail

          [default: name]
          [possible values: count, name, diff]

      --hide-passed
          Do not log passed filenames

      --color <COLOR>
          When to use terminal color

          [default: auto]
          [possible values: auto, never, always]

      --log-format <LOG_FORMAT>
          Format of log messages

          [default: human]
          [possible values: human, github-actions]

  -I, --include <INCLUDE>
          Files whose contents contain paths to target files (`-` means stdin, other strings mean text file)

  -h, --help
          Print help information (use `-h` for a summary)

  -V, --version
          Print version information

```

#### [Stdio CLI](https://deno.land/x/sane_fmt@0.17.0/stdio.js)

Unlike the feature-packed [main CLI](#main-cli), the stdio CLI only function is to read TypeScript code from stdin and print formatted code to stdout.

**Installation:**

```sh
deno install \
  --unstable \
  --name=sane-fmt-stdio \
  https://deno.land/x/sane_fmt@0.17.0/stdio.js
```

**Usage Example:**

```sh
echo 'const message="hello world";' | sane-fmt-stdio
```

_Expected Output:_

```txt
const message = 'hello world'
```

### Programming Interface

* [/x/sane_fmt](https://deno.land/x/sane_fmt@0.17.0/index.ts)
* [API Reference](https://doc.deno.land/https/deno.land//x/sane_fmt@0.17.0/index.ts)

#### Example: Format a file

```javascript
import Context from 'https://deno.land/std@0.92.0/wasi/snapshot_preview1.ts'
import { u8v } from 'https://deno.land/x/sane_fmt@0.17.0/index.ts'
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
if (status) {
  throw new Error(`Program exits with code ${status}`)
}
```

#### Example: Read unformatted input and print formatted output

```javascript
import Context from 'https://deno.land/std@0.92.0/wasi/snapshot_preview1.ts'
import { u8v } from 'https://deno.land/x/sane_fmt@0.17.0/index.ts'
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
if (status) {
  throw new Error(`Program exits with code ${status}`)
}
```

## License

[MIT](https://git.io/JY6mh) © [Hoàng Văn Khải](https://ksxgithub.github.io/)
