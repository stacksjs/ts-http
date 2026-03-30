export default {
  content: [
    './pages/**/*.stx',
    './partials/**/*.stx',
    './components/**/*.stx',
  ],
  output: './dist/styles.css',
  minify: false,
  preflight: true,
  cssVariables: true,
}
