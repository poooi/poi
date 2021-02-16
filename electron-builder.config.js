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

console.log('Building arch:', arch)

const createTargets = (targets) =>
  targets.map((target) => ({
    target,
    arch,
  }))

module.exports = {
  appId: 'org.poooi.poi',
  asar: true,
  npmRebuild: false,
  copyright: `Copyright ©${new Date().getFullYear()} poi Contributors`,
  mac: {
    publish: [],
    icon: 'assets/icons/poi.icns',
    category: 'public.app-category.games',
    provisioningProfile: 'poi.provisionprofile',
    target: createTargets(['dmg', 'zip']),
  },
  win: {
    publish: [],
    icon: 'assets/icons/poi.ico',
    target: createTargets(['nsis', '7z']),
  },
  linux: {
    publish: [],
    target: createTargets(['7z', 'deb', 'rpm', 'pacman', 'AppImage']),
    icon: 'assets/icons',
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
