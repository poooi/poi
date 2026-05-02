// CJS bootstrap — runs before the ESM renderer bundle.
// Registers @babel/register so legacy CJS plugins can require() TypeScript files,
// and loads polyfills that backward-compatible plugins expect via require().
require('@babel/register')(require('../../babel-register.config'))
require('../../views/polyfills/react-bootstrap')
