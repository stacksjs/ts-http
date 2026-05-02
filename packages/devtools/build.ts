import plugin from 'bun-plugin-dtsx'

await Bun.build({
  entrypoints: ['./src/index.ts', './src/cli.ts'],
  outdir: './dist',
  target: 'bun',
  format: 'esm',
  splitting: true,
  external: [
    '@cwcss/crosswind',
    '@stacksjs/httx',
    '@stacksjs/stx',
    'bun-plugin-stx',
    'bun-plugin-stx/serve',
    'bunfig',
    'ts-broadcasting',
  ],
  sourcemap: 'external',
  minify: false,
  plugins: [plugin()],
})

console.log('Build complete!')
