declare module 'poi-lib-battle' {
  export const Models: {
    Battle: new (opts: { fleet: unknown; packet: unknown[] }) => { packet: unknown[] }
    Fleet: new (opts: { type: number; main: unknown; escort?: unknown }) => unknown
    [key: string]: unknown
  }

  export const Simulator: {
    auto: (
      battle: unknown,
      opts?: unknown,
    ) => {
      mainFleet?: unknown[]
      escortFleet?: unknown[]
      enemyFleet?: unknown[]
      enemyEscort?: unknown[]
    }
  }
}
