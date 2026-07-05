export const DOWNLOAD_URL = 'https://poi.moe/download'

export const isTranslatedNonArm64Build = (
  arch: NodeJS.Architecture,
  runningUnderARM64Translation: boolean,
) => arch !== 'arm64' && runningUnderARM64Translation

export const shouldShowArchitectureMismatchDialog = (
  arch: NodeJS.Architecture,
  runningUnderARM64Translation: boolean,
  dismissedVersion: string,
  currentVersion: string,
) =>
  isTranslatedNonArm64Build(arch, runningUnderARM64Translation) &&
  dismissedVersion !== currentVersion
