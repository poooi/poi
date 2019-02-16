import path from 'path'
// chalk stops color output under CI mode, we manually enable it
process.env.FORCE_COLOR = 1

// to make path related results consistent across different OS
global.ROOT = __dirname
global.EXROOT = path.join(__dirname, 'exroot')
