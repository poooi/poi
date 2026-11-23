export type InstallerErrorCode =
  | 'EBADPACKAGE'
  | 'EBADSPEC'
  | 'EBADSTATE'
  | 'EIDENTITY'
  | 'ELOCK'
  | 'ENPM'
  | 'ENOTFOUND'
  | 'EPATH'
  | 'ETIMEDOUT'
  | 'EUNSUPPORTED'

export class InstallerError extends Error {
  readonly code: InstallerErrorCode
  readonly stage: string
  readonly packageName?: string
  readonly detail?: string

  constructor(
    code: InstallerErrorCode,
    message: string,
    options: { stage?: string; packageName?: string; detail?: string } = {},
  ) {
    super(message)
    this.name = 'InstallerError'
    this.code = code
    this.stage = options.stage ?? 'installer'
    this.packageName = options.packageName
    this.detail = options.detail
  }
}
