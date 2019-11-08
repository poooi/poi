/* eslint-disable @typescript-eslint/class-name-casing */

declare module 'kckit' {
  export interface AACIDatum {
    fixed: number
    modifier: number
    icons?: Array<number | string>
    ship?: {
      isClass?: number
      isBB?: boolean
      hasSlotMin?: number
      isSS?: boolean
      isNotClass?: number
      isID?: number[] | number
    }
    equipments?: AACIEquipments
    id: number
    conditions?: AACICondition[]
  }

  export interface AACICondition {
    icons: string[]
    ship: {
      isID: number[]
    }
    equipments: {
      hasID?: number[]
      hasID_301?: number
    }
  }

  export interface AACIEquipments {
    hasHAMount?:
      | boolean
      | number
      | {
          hasStat: {
            aa: number[]
          }
        }
    hasRadar?: boolean
    hasLargeCaliber?: boolean
    hasType3Shell?: boolean
    hasAAFD?: boolean
    hasAARadar?: boolean
    hasHAMountAAFD?: boolean | number
    hasAAGunCD?: boolean
    hasAAGun?:
      | boolean
      | {
          hasStat: {
            aa: number[] | number
          }
          count?: number
        }
    hasID?: number[] | number
    hasID_308?: number
    hasID_313?: number
    hasID_307?: number
  }

  namespace check {
    function aaci(ship: number): AACIDatum[]
    function aaci(ship: number, equipments: number[]): AACIDatum[]
    function aaci(ship: number, equipments: number[], aaciId: number | number[]): boolean
  }
}
