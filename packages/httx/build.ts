import { dts } from 'bun-plugin-dtsx'

process.chdir(import.meta.dir)

await Bun.build({
  entrypoints: ['./src/index.ts', './bin/cli.ts'],
  outdir: './dist',
  format: 'esm',
  target: 'node',
  minify: true,
  splitting: true,
  plugins: [dts()],
})

console.log('Build complete!')
