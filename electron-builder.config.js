/* eslint-disable no-console */

let arch = ['x64']

switch (process.env.ARCH) {
  case 'x64':
    arch = ['x64']
    break
  case 'arm64':
    arch = ['arm64']
    break
  case 'all':
    arch = ['x64', 'arm64']
    break
}

const isFullTarget = process.env.FULL_TARGET === 'true'

console.log('Building arch:', arch)

const createTargets = (targets) =>
  targets.map((target) => ({
    target,
    arch,
  }))

module.exports = {
  appId: 'org.poooi.poi',
  asar: true,
  // Electron ships 55 locale paks; keep only the LOCALES of `views/env-parts/i18next.ts`.
  // Region-qualified entries still match Electron's bare paks (`ja-JP` -> `ja.pak`).
  // Saves ~7.5MB per arch, and applies to the locales dir on win/linux too, not just
  // mac's .lproj bundles.
  electronLanguages: ['en-US', 'zh-CN', 'zh-TW', 'ja-JP', 'ko-KR'],
  // Dependency build cruft, none of it reachable at runtime: source maps are ~27% of
  // app.asar on their own. poi's own code ships compiled .js and has no maps, so these
  // only ever match inside node_modules. Sentry symbols are uploaded separately by
  // build/sentry-symbols.js and do not rely on shipped maps.
  files: ['**/*', '!**/*.{map,tsbuildinfo,flow}', '!**/node_modules/**/*.md'],
  copyright: `Copyright ©${new Date().getFullYear()} poi Contributors`,
  mac: {
    publish: [],
    icon: 'assets/icons/poi.icns',
    category: 'public.app-category.games',
    provisioningProfile: 'poi.provisionprofile',
    target: createTargets(isFullTarget ? ['dmg', 'zip'] : ['zip']),
  },
  win: {
    publish: [],
    icon: 'assets/icons/poi.ico',
    verifyUpdateCodeSignature: false,
    // Electron dropped Windows 32-bit builds after 36, so no ia32 target here.
    target: createTargets(isFullTarget ? ['nsis', '7z'] : ['7z']),
  },
  linux: {
    publish: [],
    target: createTargets(isFullTarget ? ['7z', 'deb', 'rpm', 'pacman', 'AppImage'] : ['7z']),
    // must be a dir of `<size>x<size>.png` files; electron-builder ignores other names
    icon: 'assets/icons/linux',
  },
  dmg: {
    contents: [
      {
        x: 410,
        y: 220,
        type: 'link',
        path: '/Applications',
      },
      {
        x: 130,
        y: 220,
        type: 'file',
      },
    ],
  },
  nsis: {
    artifactName: 'poi-setup-${version}.${ext}',
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    multiLanguageInstaller: true,
  },
  directories: {
    app: 'app_compiled',
    output: 'dist',
    buildResources: 'build',
  },
}
