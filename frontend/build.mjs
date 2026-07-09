// Standalone build — replaces Vite with esbuild + the Tailwind CLI.
//
//   node build.mjs          one-off production build into ./dist
//   node build.mjs --serve  build, then serve ./dist on http://localhost:5173
//                           with live rebuild on source changes
//
// esbuild bundles src/main.tsx (resolving the `@` alias) and Tailwind is run
// as a separate step, exactly like the old postcss pipeline did under Vite.

import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import esbuild from 'esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = __dirname
const outdir = path.join(root, 'dist')
const serve = process.argv.includes('--serve')

// Resolve `@/foo` imports to `src/foo`, matching the old vite.config alias.
// We return a resolved absolute path, so esbuild skips its own extension
// resolution — replicate it here (try .tsx/.ts/... and /index.*).
const exts = ['', '.tsx', '.ts', '.jsx', '.js', '.css', '.json']
function resolveWithExt(base) {
  for (const ext of exts) {
    const p = base + ext
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p
  }
  for (const ext of exts.slice(1)) {
    const p = path.join(base, 'index' + ext)
    if (fs.existsSync(p)) return p
  }
  return base
}
const aliasPlugin = {
  name: 'alias-@',
  setup(build) {
    build.onResolve({ filter: /^@\// }, (args) => ({
      path: resolveWithExt(path.join(root, 'src', args.path.slice(2))),
    }))
  },
}

// esbuild will try to bundle the `import './index.css'` in main.tsx, but it
// can't process @tailwind directives — Tailwind's own CLI does that below.
// So we swallow the CSS import here and link the Tailwind output in index.html.
const ignoreCssPlugin = {
  name: 'ignore-css',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'js' }))
  },
}

const esbuildOptions = {
  entryPoints: [path.join(root, 'src/main.tsx')],
  bundle: true,
  format: 'esm',
  splitting: false,
  sourcemap: true,
  minify: !serve,
  target: 'es2020',
  jsx: 'automatic',
  loader: { '.svg': 'file', '.png': 'file', '.jpg': 'file' },
  define: { 'process.env.NODE_ENV': JSON.stringify(serve ? 'development' : 'production') },
  outfile: path.join(outdir, 'app.js'),
  plugins: [aliasPlugin, ignoreCssPlugin],
  logLevel: 'info',
}

function copyPublic() {
  fs.mkdirSync(outdir, { recursive: true })
  const pub = path.join(root, 'public')
  for (const f of fs.readdirSync(pub)) {
    fs.copyFileSync(path.join(pub, f), path.join(outdir, f))
  }
}

function writeIndexHtml() {
  const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  const html = src.replace(
    '<script type="module" src="/src/main.tsx"></script>',
    '<link rel="stylesheet" href="/app.css" />\n    <script type="module" src="/app.js"></script>',
  )
  fs.writeFileSync(path.join(outdir, 'index.html'), html)
}

// Run the Tailwind CLI to compile src/index.css → dist/app.css.
function buildCss({ watch } = {}) {
  const bin = path.join(root, 'node_modules/.bin/tailwindcss')
  const args = ['-i', 'src/index.css', '-o', 'dist/app.css']
  if (!serve) args.push('--minify')
  if (watch) args.push('--watch')
  // shell: true so this also works on Windows — spawn() can't directly exec an
  // extensionless POSIX shim like node_modules\.bin\tailwindcss without a shell
  // (throws ENOENT / errno -4058 even though the file exists).
  const child = spawn(bin, args, { cwd: root, stdio: 'inherit', shell: true })
  return child
}

async function main() {
  copyPublic()
  writeIndexHtml()

  if (serve) {
    buildCss({ watch: true })
    const ctx = await esbuild.context(esbuildOptions)
    await ctx.watch()
    const { host, port } = await ctx.serve({ servedir: outdir, port: 5173 })
    console.log(`\n  ➜  Serving on http://localhost:${port}  (Ctrl+C to stop)\n`)
  } else {
    await esbuild.build(esbuildOptions)
    await new Promise((resolve, reject) => {
      const css = buildCss()
      css.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('tailwind failed'))))
    })
    console.log('\n  ✓ Built to ./dist\n')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
