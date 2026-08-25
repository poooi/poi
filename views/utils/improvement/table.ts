/**
 * 改修 (★) bonus tables.
 *
 * The game never announces these: improving a piece of equipment changes what
 * it contributes to a stat or an attack, but `api_mst_slotitem` keeps printing
 * the ★0 values and the ship's own stat line folds the result in silently. The
 * numbers below are the community's measured modifiers, so they move whenever a
 * new category is tested.
 *
 * Primary source is wikiwiki, per-mechanic rather than one page:
 * 改修工廠 https://wikiwiki.jp/kancolle/%E6%94%B9%E4%BF%AE%E5%B7%A5%E5%BB%A0
 *   — 昼戦/夜戦 火力, 雷撃, 命中, 回避, 索敵, and the 制空値 list.
 * 対潜攻撃 https://wikiwiki.jp/kancolle/%E5%AF%BE%E6%BD%9C%E6%94%BB%E6%92%83
 *   — "ソナーと（広義の）爆雷の改修値は、基本攻撃力に√★が加算される".
 *
 * 遠征 https://wikiwiki.jp/kancolle/%E9%81%A0%E5%BE%81#about_stat — the 遠征 terms.
 *
 * Where wikiwiki names equipment one by one (副砲, 爆戦, 触接) the ids are listed
 * here too, so poi follows the wiki rather than a stat heuristic.
 *
 * Second source, and the model this table follows for stat bonuses — noro6's
 * kc-web (制空権シミュレータ), whose `Item.getBonus*` are per stat rather than per
 * attack: https://github.com/noro6/kc-web/blob/main/src/classes/item/item.ts
 *
 * Rules marked `KC3 only` are neither wiki-stated nor in kc-web, and come from
 * KC3Kai's `KC3Gear.prototype.*ImprovementBonus`, which cites its own testing:
 * https://github.com/KC3Kai/KC3Kai/blob/develop/src/library/objects/Gear.js
 *
 * Provenance and licences for both projects: ../../../THIRD_PARTY_NOTICES.md
 */

/**
 * What the bonus is added to. Two units live here, and mixing them up is the
 * easiest mistake to make:
 *
 * - `power` is **attack power** in whichever attack the context names.
 * - everything else is the **equipment stat**, as the tooltip prints it.
 *
 * 対潜 shows the difference. A ★ on a ソナー raises its 対潜 stat by ⅔√★, and
 * the ASW formula multiplies equipment 対潜 by 1.5, so the same ★ is worth √★
 * of attack power. Both numbers are correct; only one belongs on a stat line.
 */
export type ImprovementStat =
  /** Attack power, in whichever attack the context names. */
  | 'power'
  /** 雷装, which 雷撃戦 and an 艦攻/陸攻 airstrike both read. */
  | 'torpedo'
  /** 爆装. */
  | 'bomber'
  /** 対潜. */
  | 'asw'
  /** 装甲. */
  | 'armor'
  | 'accuracy'
  | 'evasion'
  /** 索敵, as it enters 判定式(33) / 触接. */
  | 'los'
  /** 対空, as it enters 制空値. */
  | 'aa'

/**
 * Which attack — or which screen — the bonus applies to. The same equipment can
 * improve differently in each: a 潜水艦魚雷 adds 0.2×★ 火力 in a day battle but
 * √★ in 夜戦, and a 艦爆 that counts as 爆戦 trades its 火力 bonus for a 対空 one.
 */
export type ImprovementContext =
  /** 昼砲撃戦, and the default for anything not fought out. */
  | 'fire'
  /** 雷撃戦. */
  | 'torpedo'
  /** 夜戦. */
  | 'yasen'
  /** 対潜攻撃. */
  | 'asw'
  /** 航空戦 and 基地航空隊. */
  | 'airstrike'
  /** 遠征. Results are floored to one decimal. */
  | 'exped'
  /** 触接. Also floored to one decimal. */
  | 'contact'

/** A master stat a rule can gate on. */
export type ImprovementGuardStat = 'api_houg' | 'api_houm' | 'api_tais'

/**
 * One row of a context's table. Rules are tried in order and the first match
 * wins, so a narrow rule (an id list, a stat threshold) has to precede the
 * broad category rule it carves out of. A `factor` of 0 is how an exception is
 * written: it matches, and contributes nothing.
 */
export interface ImprovementRule {
  /** Master ids this rule matches. */
  ids?: number[]
  /** `api_type[2]` values this rule matches. */
  types?: number[]
  /** `api_type[3]`, the icon, the item must carry. */
  icon?: number
  /** A master stat that must be strictly greater than `value`. */
  above?: { stat: ImprovementGuardStat; value: number }
  /** Bonus per ★ (`linear`) or per √★ (`sqrt`). */
  factor: number
  scale: 'sqrt' | 'linear'
}

export type ImprovementTable = {
  [S in ImprovementStat]?: {
    [C in ImprovementContext]?: ImprovementRule[]
  }
}

/**
 * 爆戦 — 艦上爆撃機 that behave as fighters when improved: they gain 対空 rather
 * than 火力. wikiwiki names them one by one rather than giving a 対空 threshold
 * (彗星一二型(六三四空/三号爆弾搭載機) and Re.2001 CB改 carry a fighter's 対空 yet
 * improve as plain 艦爆), and 零式艦戦64型(熟練爆戦) is listed with the ★×0.3
 * planes instead of the ★×0.25 ones.
 * https://x.com/noro_006/status/1862461148853149834
 */
export const FIGHTER_BOMBER_IDS = [
  60, // 零式艦戦62型(爆戦)
  154, // 零戦62型(爆戦/岩井隊)
  219, // 零式艦戦63型(爆戦)
  447, // 零式艦戦64型(複座KMX搭載機)
  487, // 零式艦戦64型(熟練爆戦)
]

/**
 * 狭義の爆雷 — 爆雷投射機 share their category but only these are the 爆雷 proper,
 * which improve neither 砲撃 火力 nor 命中. kc-web's `STRICT_DEPTH_CHARGE`; KC3's
 * 火力 branch lists only the first two and 488.
 */
const STRICT_DEPTH_CHARGE_IDS = [
  226, // 九五式爆雷
  227, // 二式爆雷
  378, // 試製15cm9連装対潜噴進砲
  439, // ヘッジホッグ(初期型)
  488, // 対潜短魚雷(試作初期型)
]

/** 主砲・徹甲弾・機銃 and the other 昼戦 √★ items, from KCVita. */
const DAY_SHELLING_TYPES = [
  1, // 小口径主砲
  2, // 中口径主砲
  18, // 三式弾
  19, // 徹甲弾
  21, // 対空機銃
  24, // 上陸用舟艇
  29, // 探照灯
  34, // 司令部施設
  35, // 航空要員
  36, // 高射装置
  37, // 対地噴進砲
  39, // 水上艦要員
  42, // 大型探照灯
  46, // 特型内火艇
  52, // 陸戦部隊
  54, // 発煙装置
]

/**
 * 副砲 improve one by one — "副砲は装備によって攻撃力上昇値が異なる" — so wikiwiki
 * sorts them into three classes rather than giving a rule. Each class pays the
 * same by day and by night. The lists below are the ones it names; anything
 * else falls through to the stat heuristic under them, which reproduces every
 * named member and is the only generalization anyone has published.
 */
/** 分類A: √★, a 主砲's rate. */
const SECONDARY_CLASS_A = [
  11, // 15.2cm単装砲
  134, // OTO 152mm三連装速射砲
  135, // 90mm単装高角砲 — KC3 only, wikiwiki does not place it
]
/** 分類B: ★×0.2. */
const SECONDARY_CLASS_B = [
  10, // 12.7cm連装高角砲
  66, // 8cm高角砲
  220, // 8cm高角砲改+増設機銃
  275, // 10cm連装高角砲改+増設機銃
  464, // 10cm連装高角砲群 集中配備
]
/** 分類C: ★×0.3. */
const SECONDARY_CLASS_C = [
  12, // 15.5cm三連装副砲
  234, // 15.5cm三連装副砲改
  247, // 15.2cm三連装砲
  467, // 5inch連装砲(副砲配置) 集中配備
]

export const DEFAULT_IMPROVEMENT_TABLE: Required<ImprovementTable> = {
  power: {
    fire: [
      // "大口径主砲の装備別補正値については、昼は1.5、夜は小口径砲と同じ1.0になる".
      // By category, as wikiwiki and kc-web both have it — KC3 matches on 火力 > 12
      // instead, which selects exactly the same equipment today.
      { types: [3], factor: 1.5, scale: 'sqrt' },
      { types: DAY_SHELLING_TYPES, factor: 1, scale: 'sqrt' },
      { ids: SECONDARY_CLASS_A, factor: 1, scale: 'sqrt' },
      { ids: SECONDARY_CLASS_B, factor: 0.2, scale: 'linear' },
      { ids: SECONDARY_CLASS_C, factor: 0.3, scale: 'linear' },
      // Unlisted 副砲: 高角砲 (icon 16) split at 火力 4, everything else 0.3.
      // KC3 only — https://twitter.com/hedgehog_hasira/status/1545868174259720192
      { types: [4], icon: 16, above: { stat: 'api_houg', value: 4 }, factor: 0.3, scale: 'linear' },
      { types: [4], icon: 16, factor: 0.2, scale: 'linear' },
      { types: [4], factor: 0.3, scale: 'linear' },
      // 爆戦 take their bonus as 対空 instead
      { ids: FIGHTER_BOMBER_IDS, factor: 0, scale: 'linear' },
      { types: [7, 57, 8, 58], factor: 0.2, scale: 'linear' },
      // ソナー and 爆雷投射機 both 0.75√★ in 砲撃戦
      { types: [14, 40], factor: 0.75, scale: 'sqrt' },
      // 爆雷 proper give no 砲撃 bonus, unlike the 爆雷投射機 sharing their category
      // https://twitter.com/hedgehog_hasira/status/1509928826117054469
      { ids: STRICT_DEPTH_CHARGE_IDS, factor: 0, scale: 'sqrt' },
      { types: [15], factor: 0.75, scale: 'sqrt' },
    ],
    torpedo: [
      { types: [5, 21], factor: 1.2, scale: 'sqrt' },
      // 潜水艦魚雷 https://twitter.com/CC_jabberwock/status/1492866480102248451
      { types: [32], factor: 0.2, scale: 'linear' },
    ],
    yasen: [
      {
        types: [1, 2, 3, 5, 19, 22, 24, 29, 34, 35, 36, 37, 38, 39, 42, 46, 52, 54],
        factor: 1,
        scale: 'sqrt',
      },
      // The 副砲 classes pay the same by night as by day
      { ids: SECONDARY_CLASS_A, factor: 1, scale: 'sqrt' },
      { ids: SECONDARY_CLASS_B, factor: 0.2, scale: 'linear' },
      { ids: SECONDARY_CLASS_C, factor: 0.3, scale: 'linear' },
      // Unlisted 副砲, KC3 only: 夜戦 drops the day 火力 split and pays every
      // 高角砲 the low rate.
      { types: [4], icon: 16, factor: 0.2, scale: 'linear' },
      { types: [4], factor: 0.3, scale: 'linear' },
      { types: [32], factor: 0.2, scale: 'linear' },
      { types: [7, 57, 8, 58], factor: 1, scale: 'sqrt' },
    ],
    asw: [
      // "ソナーと（広義の）爆雷の改修値は、基本攻撃力に√★が加算される" — 対潜攻撃
      { types: [14, 15, 40], factor: 1, scale: 'sqrt' },
      // The rest of this context is KC3 only; wikiwiki gives no aircraft term.
      // 零式艦戦64型 variants count as both 爆戦 and 艦爆 here
      { ids: [447, 487], factor: 0.2, scale: 'linear' },
      { ids: FIGHTER_BOMBER_IDS, factor: 0, scale: 'linear' },
      { types: [7, 57, 8, 58], factor: 0.2, scale: 'linear' },
      // オートジャイロ, then 対潜哨戒機 — both split on their own 対潜
      { types: [25], above: { stat: 'api_tais', value: 10 }, factor: 0.3, scale: 'linear' },
      { types: [25], factor: 0.2, scale: 'linear' },
      { types: [26], above: { stat: 'api_tais', value: 7 }, factor: 0.3, scale: 'linear' },
      { types: [26], factor: 0.2, scale: 'linear' },
    ],
    // KC3 only: wikiwiki documents no 改修 term in the 航空戦 power formula
    airstrike: [
      { ids: FIGHTER_BOMBER_IDS, factor: 0, scale: 'linear' },
      { types: [7, 57, 8, 58, 11], factor: 0.2, scale: 'linear' },
      // 四式重爆 飛龍(熟練)+イ号一型甲 誘導弾 measures higher than the rest
      // https://twitter.com/kancolle_aki/status/1732452282611154982
      { ids: [484], factor: 0.75, scale: 'sqrt' },
      { types: [47, 53], factor: 0.7, scale: 'sqrt' },
    ],
    // 遠征 (月次・戦闘). https://wikiwiki.jp/kancolle/%E9%81%A0%E5%BE%81#about_stat
    // 小口径主砲 0.5√★, 中口径・大口径 √★, 副砲 0.5√★, 小型電探 0.5√★, 大型電探 √★.
    // KC3 has 副砲 at ★×0.15 instead; wikiwiki and kc-web agree on 0.5√★.
    exped: [
      { types: [1, 4, 12], factor: 0.5, scale: 'sqrt' },
      { types: [2, 3, 13], factor: 1, scale: 'sqrt' },
      // 徹甲弾・機銃, KC3 only — wikiwiki lists neither
      { types: [19, 21], factor: 0.5, scale: 'sqrt' },
    ],
    contact: [],
  },
  // 雷装. Read by 雷撃戦 and by an 艦攻 / 陸攻 airstrike alike, so it has no
  // context split — kc-web keeps one `bonusTorpedo` for all of them.
  torpedo: {
    fire: [
      { types: [5, 21], factor: 1.2, scale: 'sqrt' }, // 魚雷・機銃
      { types: [32], factor: 0.2, scale: 'linear' }, // 潜水艦魚雷
      { types: [8], factor: 0.2, scale: 'linear' }, // 艦攻
      // 陸攻・大型陸上機, 東海系 (icon 47) excepted — they carry 対潜, not 雷装.
      // 四式重爆 飛龍(熟練)+イ号一型甲 誘導弾 measures higher than the rest:
      // https://twitter.com/kancolle_aki/status/1732452282611154982
      { types: [47, 53], icon: 47, factor: 0, scale: 'sqrt' },
      { ids: [484], factor: 0.75, scale: 'sqrt' },
      { types: [47, 53], factor: 0.7, scale: 'sqrt' },
    ],
    torpedo: [],
    yasen: [],
    asw: [],
    airstrike: [],
    exped: [],
    contact: [],
  },
  // 爆装
  bomber: {
    fire: [
      { ids: FIGHTER_BOMBER_IDS, factor: 0, scale: 'linear' },
      { types: [7], factor: 0.2, scale: 'linear' }, // 艦爆 (爆戦を除く)
      { types: [11], factor: 0.2, scale: 'linear' }, // 水上爆撃機
    ],
    torpedo: [],
    yasen: [],
    asw: [],
    airstrike: [],
    exped: [],
    contact: [],
  },
  /**
   * 対潜. Note the units: this is the *stat*, so ソナー gain ⅔√★ here where
   * `power.asw` — the same ★ seen through the ×1.5 the ASW formula applies to
   * equipment 対潜 — is √★.
   */
  asw: {
    fire: [
      { types: [14, 15, 40], factor: 2 / 3, scale: 'sqrt' }, // ソナー・爆雷
      { types: [7, 8], factor: 0.2, scale: 'linear' }, // 艦攻・艦爆
      // 対潜哨戒機 and オートジャイロ split on their own 対潜
      { types: [26], above: { stat: 'api_tais', value: 7 }, factor: 0.3, scale: 'linear' },
      { types: [26], factor: 0.2, scale: 'linear' },
      { types: [25], above: { stat: 'api_tais', value: 10 }, factor: 0.3, scale: 'linear' },
      { types: [25], factor: 0.2, scale: 'linear' },
      // 東海系: the 陸上攻撃機 that carry 対潜 rather than 雷装
      { types: [47, 53], icon: 47, factor: 0.66, scale: 'sqrt' },
    ],
    torpedo: [],
    yasen: [],
    asw: [],
    airstrike: [],
    // ソナー・爆雷投射機・爆雷 √★ on an expedition
    exped: [{ types: [14, 15, 40], factor: 1, scale: 'sqrt' }],
    contact: [],
  },
  // 装甲 — バルジ only. kc-web; neither wikiwiki's 改修工廠 table nor KC3 carries it.
  armor: {
    fire: [
      { types: [27], factor: 0.2, scale: 'linear' }, // 中型バルジ
      { types: [28], factor: 0.3, scale: 'linear' }, // 大型バルジ
    ],
    torpedo: [],
    yasen: [],
    asw: [],
    airstrike: [],
    exped: [],
    contact: [],
  },
  accuracy: {
    fire: [
      { types: [1, 2, 3, 4, 18, 19, 24, 29, 34, 36, 37, 39, 42, 46], factor: 1, scale: 'sqrt' },
      // ソナー, 爆雷 proper excepted (kc-web)
      { ids: STRICT_DEPTH_CHARGE_IDS, factor: 0, scale: 'sqrt' },
      { types: [14, 15, 40], factor: 1, scale: 'sqrt' },
      // 電探 with 命中3以上, i.e. a 水上電探, improve accuracy at 1.7√★
      { types: [12, 13, 93], above: { stat: 'api_houm', value: 2 }, factor: 1.7, scale: 'sqrt' },
      { types: [12, 13], factor: 1, scale: 'sqrt' },
    ],
    torpedo: [
      { types: [21], factor: 1, scale: 'sqrt' },
      { types: [5, 32], factor: 2, scale: 'sqrt' },
    ],
    // KC3 only — https://twitter.com/Divinity_123/status/1680199577989685251
    yasen: [
      {
        types: [1, 2, 3, 4, 5, 18, 19, 22, 24, 29, 34, 36, 39, 42, 46],
        factor: 1.3,
        scale: 'sqrt',
      },
      { types: [12, 13, 93], above: { stat: 'api_houm', value: 2 }, factor: 1.6, scale: 'sqrt' },
      { types: [12, 13], factor: 1.3, scale: 'sqrt' },
    ],
    asw: [{ types: [14, 15, 40], factor: 1.3, scale: 'sqrt' }],
    airstrike: [],
    // 遠征 pays accuracy exactly as a day battle does, radars included
    exped: [
      { types: [1, 2, 3, 4, 18, 19, 24, 29, 34, 36, 39, 42, 46], factor: 1, scale: 'sqrt' },
      { types: [12, 13, 93], above: { stat: 'api_houm', value: 2 }, factor: 1.7, scale: 'sqrt' },
      { types: [12, 13], factor: 1, scale: 'sqrt' },
    ],
    contact: [],
  },
  evasion: {
    // 缶・タービン: "新型高温高圧缶の場合1個あたり1.5√★(%)"
    fire: [{ types: [17], factor: 1.5, scale: 'sqrt' }],
    // 改修した水中聴音機/水中探信儀 raise 雷撃 evasion by 1.5√★
    torpedo: [{ types: [14, 40], factor: 1.5, scale: 'sqrt' }],
    yasen: [],
    asw: [],
    airstrike: [],
    exped: [{ types: [17], factor: 1.5, scale: 'sqrt' }],
    contact: [],
  },
  los: {
    // 小型電探 1.25√★, 大型電探 1.4√★, 水偵・艦偵 1.2√★, 水爆 1.15√★
    fire: [
      { types: [12], factor: 1.25, scale: 'sqrt' },
      { types: [13, 93], factor: 1.4, scale: 'sqrt' },
      { types: [9, 10, 41, 49, 59, 94], factor: 1.2, scale: 'sqrt' },
      { types: [11], factor: 1.15, scale: 'sqrt' },
      // 対潜哨戒機 — KC3 only
      { types: [26], factor: 1, scale: 'sqrt' },
    ],
    torpedo: [],
    yasen: [],
    asw: [],
    airstrike: [],
    // 電探 √★, 艦偵・水偵 √★ (KC3 has 0.95 for the larger ones; wikiwiki and
    // kc-web both say √★ flat)
    exped: [{ types: [9, 10, 12, 13, 93], factor: 1, scale: 'sqrt' }],
    // 触接選択率. wikiwiki confirms ★ raises it for 水偵/艦偵 but gives no formula;
    // these follow kc-web's tests via KC3Kai.
    // https://github.com/noro6/kc-web/blob/main/src/classes/item/item.ts
    contact: [
      { ids: [59, 539, 543], factor: 0.2, scale: 'linear' },
      { ids: [151, 178], factor: 0.4, scale: 'linear' },
      // 夜間偵察機 (icon 50) contact worse than a day seaplane
      { types: [10], icon: 50, factor: 0.1, scale: 'linear' },
      { types: [10], factor: 0.14, scale: 'linear' },
      { types: [9, 49, 59, 94], factor: 0.25, scale: 'linear' },
      { types: [41], factor: 0.3, scale: 'linear' },
    ],
  },
  aa: {
    // 制空値. wikiwiki gives 艦戦・水戦・陸戦 ★×0.2, 爆戦 ★×0.25, the two
    // 零式艦戦64型 ★×0.3, and 陸攻・大型陸上機 0.5×√★; 陸上偵察機 and 大型飛行艇
    // are confirmed to gain 制空値 but "改修強化値の正確な式は不明", so those two
    // take KC3Kai's tested values.
    fire: [
      { ids: [486, 487], factor: 0.3, scale: 'linear' },
      { ids: FIGHTER_BOMBER_IDS, factor: 0.25, scale: 'linear' },
      { types: [6, 45, 48], factor: 0.2, scale: 'linear' },
      // 噴式戦闘機 improves like the fighter it is, once it becomes improvable
      { types: [56], factor: 0.2, scale: 'linear' },
      { types: [49], factor: 0.2, scale: 'linear' }, // 陸上偵察機 — provisional
      { types: [41], factor: 0.15, scale: 'linear' }, // 大型飛行艇 — provisional
      { types: [47, 53], factor: 0.5, scale: 'sqrt' },
    ],
    torpedo: [],
    yasen: [],
    asw: [],
    airstrike: [],
    // 対空 stat on an expedition: 高角砲 and 機銃 only
    exped: [
      { types: [1, 2, 4], icon: 16, factor: 1, scale: 'sqrt' },
      { types: [21], factor: 1, scale: 'sqrt' },
    ],
    contact: [],
  },
}
