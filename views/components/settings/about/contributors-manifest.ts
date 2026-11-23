export const CREDITS_MANIFEST_URL = 'https://poi.moe/api/credits/manifest.json'

export const CREDITS_MANIFEST_TIMEOUT_MS = 15_000

export const CONTRIBUTOR_AVATAR_SIZE = 40

interface CreditsManifestSheet {
  url: string
  width: number
  height: number
}

interface CreditsManifestAvatar {
  sheet: number
  x: number
  y: number
}

interface CreditsManifestContributor {
  id: string
  login: string
  name: string | null
  profile: string
}

interface CreditsManifest {
  cellSize: number
  sheets: CreditsManifestSheet[]
  avatars: Record<string, CreditsManifestAvatar>
  contributors: CreditsManifestContributor[]
}

export interface ContributorAvatarSprite {
  url: string
  sheetWidth: number
  sheetHeight: number
  offsetX: number
  offsetY: number
}

export interface Contributor {
  id: string
  label: string
  profile: string | null
  avatar: ContributorAvatarSprite | null
}

const toProfileUrl = (value: string): string | null => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

const toSprite = (
  manifest: CreditsManifest,
  manifestUrl: string,
  avatar: CreditsManifestAvatar,
): ContributorAvatarSprite | null => {
  const sheet = manifest.sheets[avatar.sheet]
  if (!sheet) return null
  const scale = (value: number) => (value * CONTRIBUTOR_AVATAR_SIZE) / manifest.cellSize
  return {
    url: new URL(sheet.url, manifestUrl).href,
    sheetWidth: scale(sheet.width),
    sheetHeight: scale(sheet.height),
    offsetX: scale(avatar.x),
    offsetY: scale(avatar.y),
  }
}

export const normalizeCreditsManifest = (
  raw: unknown,
  manifestUrl = CREDITS_MANIFEST_URL,
): Contributor[] => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- the API publishes this schema and validates it upstream
  const manifest = raw as CreditsManifest
  return manifest.contributors.map(({ id, login, name, profile }) => {
    const avatar = manifest.avatars[id]
    return {
      id,
      label: name || login,
      profile: toProfileUrl(profile),
      avatar: avatar ? toSprite(manifest, manifestUrl, avatar) : null,
    }
  })
}

export const loadContributors = async (signal?: AbortSignal): Promise<Contributor[]> => {
  const timeoutSignal = AbortSignal.timeout(CREDITS_MANIFEST_TIMEOUT_MS)
  const requestSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal

  const response = await fetch(CREDITS_MANIFEST_URL, { signal: requestSignal })
  if (!response.ok) {
    throw new Error(`Failed to load credits manifest: HTTP ${response.status}`)
  }
  return normalizeCreditsManifest(await response.json())
}
