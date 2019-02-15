// chalk stops color output under CI mode, we manually enable it
process.env.FORCE_COLOR = 1

// to make path related results consistent across different OS
global.ROOT = '/root/'
global.EXROOT = '/exroot/'
