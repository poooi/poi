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
  npmRebuild: false,
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
    publisherName: 'poi dev team',
    target: [
      ...createTargets(isFullTarget ? ['nsis', '7z'] : ['7z']),
      { target: '7z', arch: 'ia32' },
    ],
    sign: async () => console.log('Skip signing'),
  },
  linux: {
    publish: [],
    target: createTargets(isFullTarget ? ['7z', 'deb', 'rpm', 'pacman', 'AppImage'] : ['7z']),
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
