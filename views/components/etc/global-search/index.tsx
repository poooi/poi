import type { RootState } from 'views/redux/reducer-factory'
import type {
  EquipEntry,
  EquipListMode,
  EquipListPosition,
  SelectorPosition,
  ShipEntry,
  SlotTarget,
  ShipSortKey,
  ShipTagFilter,
} from 'views/utils/game-selector'

import {
  Button,
  ButtonGroup,
  InputGroup,
  Position,
  SegmentedControl,
  Tag,
  Tooltip,
} from '@blueprintjs/core'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { StatusLabel } from 'views/components/ship-parts/statuslabel'
import i18next from 'views/env-parts/i18next'
import {
  ALL_EQUIPS_CATEGORY,
  EXTRA_SLOT,
  airbasePositions,
  allShipTabIds,
  buildAirbaseList,
  buildEquipLists,
  buildShipList,
  equipListPositions,
  shipFilterTabs,
  SHIP_SORT_KEY_NAMES,
  SHIP_SORT_KEYS,
  isEventActive,
  shipPositions,
} from 'views/utils/game-selector'
import { getShipLabelStatus, getStatusStyle, selectShipAvatarColor } from 'views/utils/game-utils'
import {
  constSelector,
  fcdShipTagColorSelector,
  inRepairShipsIdSelector,
  mapsSelector,
} from 'views/utils/selectors'

import {
  airbaseDeploymentSelector,
  equipEntriesSelector,
  selectorTablesSelector,
  shipEntriesSelector,
} from './entries'
import { isSearchMode, searchEventEmitter, type SearchMode } from './event'
import { FilterSelect } from './filter-select'
import {
  Backdrop,
  Empty,
  FilterRow,
  ListModeTagEl,
  Meta,
  Name,
  Panel,
  PillIcon,
  PositionTagEl,
  Results,
  ResultRow,
  RowALevel,
  RowAvatar,
  RowIcon,
  ShipTile,
  TileGradient,
  TileHP,
  TileLevel,
  TileName,
  TileStatusLabel,
  ScopeBar,
  SearchField,
  SearchRow,
  TabButton,
} from './styles'
import { useSearchHotkey } from './use-search-hotkey'

/** Cap the rendered rows: the list is a lookup aid, not a browsable roster. */
const MAX_RESULTS = 60

const translateName = (name: string | undefined): string =>
  name ? i18next.t(`resources:${name}`, { keySeparator: 'chiba' }) : ''

/**
 * The English name, whatever poi's display language is.
 *
 * poi-plugin-translator declares `poiPlugin.id: "resources"`, so the plugin
 * manager loads its per-locale name files into poi's own i18next under that
 * namespace — for every locale, not just the active one. Asking for `en-US`
 * therefore works while poi is displaying Japanese, which is what lets a romaji
 * query find 大和改二重. Without the plugin the namespace is absent and i18next
 * hands the key back, so this degrades to the raw name.
 */
const translateNameEn = (name: string | undefined): string =>
  name ? i18next.t(`resources:${name}`, { lng: 'en-US', keySeparator: 'chiba' }) : ''

/**
 * Captions ported from the game's own UI. They live in poi's `main` namespace
 * keyed by the original Japanese — the `resources` namespace only covers game
 * master data (and only when poi-plugin-translator is installed), so leaning on
 * it left half these labels untranslated.
 */
const translateCaption = (caption: string): string =>
  i18next.t(`main:${caption}`, { defaultValue: caption })

/**
 * Sort captions get their own prefix: the bare "Lv" would collide with poi's
 * existing `Lv` key ("Lv. {{level}}") and render as an empty level.
 */
const translateSortCaption = (caption: string): string =>
  i18next.t(`main:Sort ${caption}`, { defaultValue: caption })

const matchesQuery = (query: string, ...candidates: (string | undefined)[]): boolean => {
  if (!query) return true
  const needle = query.toLowerCase()
  return candidates.some((candidate) => candidate?.toLowerCase().includes(needle))
}

/**
 * Matches a query against the raw name, the display translation and the English
 * name — the last so a romaji query works on a poi displaying Japanese, since
 * the English name of a Japanese ship is its romaji.
 */
const matchesName = (query: string, name: string | undefined): boolean =>
  matchesQuery(query, name, translateName(name), translateNameEn(name))

const PositionTag = ({ position }: { position: SelectorPosition | undefined }) => {
  const { t } = useTranslation('main')
  if (!position) return null
  return (
    <PositionTagEl minimal>
      {t('main:Page')} {position.page} · {t('main:Row')} {position.index}
    </PositionTagEl>
  )
}

/**
 * Which of the picker's two lists an item is in. The page and row next to it
 * count from that list's own first page, so the list has to be named for the
 * position to mean anything.
 */
const ListModeTag = ({ mode }: { mode: EquipListMode }) => {
  const { t } = useTranslation('main')
  return (
    <ListModeTagEl minimal intent={mode === 'unset' ? 'success' : 'warning'}>
      {mode === 'unset' ? t('main:Unequipped list') : t('main:Equipped list')}
    </ListModeTagEl>
  )
}

/**
 * Aircraft proficiency, drawn with the same chevron art the ship panel uses.
 * Only ranks 1-7 have a badge; 0 is unflown.
 */
const Proficiency = ({ alv }: { alv: number | undefined }) => {
  if (alv == null || alv < 1 || alv > 7) return null
  return <RowALevel className="alv-img" src={`assets/img/airplane/alv${alv}.png`} alt="" />
}

interface Result<T> {
  entry: T
  position: SelectorPosition | undefined
}

/**
 * A ship result, laid out as the mini ship panel lays out its rows: the avatar
 * with the name and level stacked over it, then HP and the status label. The
 * search-only controls sit after the tile.
 */
const ShipResultRow = ({
  entry,
  position,
  enableAvatar,
  avatarType,
  shipTagColor,
  inRepair,
  onSearchEquips,
}: {
  entry: ShipEntry
  position: SelectorPosition | undefined
  enableAvatar: boolean
  avatarType: string
  shipTagColor: string[]
  inRepair: boolean
  onSearchEquips: (entry: ShipEntry) => void
}) => {
  const { t } = useTranslation('main')
  const { ship, $ship } = entry
  const nowHp = ship.api_nowhp ?? 0
  const maxHp = ship.api_maxhp ?? 1
  // Escape only applies mid-sortie, which is not what this panel is for.
  const labelStatus = getShipLabelStatus(ship, $ship, inRepair, false)
  const labelStatusStyle = getStatusStyle(labelStatus)

  return (
    <ResultRow>
      <ShipTile $avatar={enableAvatar}>
        {enableAvatar && (
          <>
            <RowAvatar
              mstId={$ship.api_id}
              isDamaged={nowHp * 2 <= maxHp}
              useDefaultBG={false}
              useFixedWidth={false}
              height={38}
            />
            <TileGradient color={selectShipAvatarColor(ship, $ship, shipTagColor, avatarType)} />
          </>
        )}
        <TileName
          $avatar={enableAvatar}
          title={$ship.api_name}
          style={enableAvatar ? undefined : labelStatusStyle}
        >
          {translateName($ship.api_name) || $ship.api_name}
        </TileName>
        <TileLevel $avatar={enableAvatar} style={enableAvatar ? undefined : labelStatusStyle}>
          {t('main:Lv', { level: ship.api_lv ?? 0 })}
        </TileLevel>
        <TileHP style={labelStatusStyle}>
          {nowHp} / {ship.api_maxhp ?? 0}
        </TileHP>
        <TileStatusLabel>
          <StatusLabel label={labelStatus} />
        </TileStatusLabel>
      </ShipTile>
      <Tooltip content={t('main:Search equipment for this ship')} position={Position.TOP}>
        <Button small minimal icon="cog" onClick={() => onSearchEquips(entry)} />
      </Tooltip>
      <PositionTag position={position} />
    </ResultRow>
  )
}

interface EquipResult {
  entry: EquipEntry
  position: EquipListPosition | undefined
}

/** Restricts the equipment list to what one ship can carry. */
interface EquipScope {
  shipMstId: number
  shipMemId: number
  name: string
  /** Number of normal slots, so the slot picker offers exactly those. */
  slots: number
  /** Whether the ex-slot (補強増設) has been opened on this ship. */
  hasExtra: boolean
}

/** `null` is "any normal slot", which is the unscoped list the panel opens on. */
const parseSlot = (value: string): SlotTarget | null => {
  if (value === EXTRA_SLOT) return EXTRA_SLOT
  const slot = Number(value)
  return Number.isFinite(slot) && slot >= 0 ? slot : null
}

const slotValue = (slot: SlotTarget | null): string =>
  slot == null ? 'any' : slot === EXTRA_SLOT ? EXTRA_SLOT : String(slot)

const GlobalSearchPanel = ({
  mode,
  setMode,
  onClose,
  closing,
  noAnimation,
}: {
  mode: SearchMode
  setMode: (mode: SearchMode) => void
  onClose: () => void
  closing?: boolean
  noAnimation?: boolean
}) => {
  const { t } = useTranslation('main')
  const [query, setQuery] = useState('')
  const [tabs, setTabs] = useState<number[] | null>(null)
  const [tag, setTag] = useState<ShipTagFilter>('all')
  const [sortKey, setSortKey] = useState<ShipSortKey>(1)
  const [equipCategory, setEquipCategory] = useState(ALL_EQUIPS_CATEGORY)
  const [airbaseTab, setAirbaseTab] = useState(0)
  const [equipScope, setEquipScope] = useState<EquipScope | null>(null)
  const [equipSlot, setEquipSlot] = useState<SlotTarget | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const shipEntries = useSelector(shipEntriesSelector)
  const equipEntries = useSelector(equipEntriesSelector)
  const constState = useSelector(constSelector)
  const maps = useSelector(mapsSelector)
  const tables = useSelector(selectorTablesSelector)
  const airbaseDeployments = useSelector(airbaseDeploymentSelector)
  const eventActive = isEventActive(maps)
  const enableAvatar = useSelector(
    (state: RootState): boolean => state.config?.poi?.appearance?.avatar ?? false,
  )
  const avatarType = useSelector(
    (state: RootState): string => state.config?.poi?.appearance?.avatarType ?? 'rarity',
  )
  const shipTagColor = useSelector(fcdShipTagColorSelector)
  const inRepairIds = useSelector(inRepairShipsIdSelector)
  const inRepair = useMemo(() => new Set(inRepairIds ?? []), [inRepairIds])

  // The tab set comes from the (possibly fcd-updated) table, so the initial
  // "everything on" state cannot be captured at mount time.
  const allTabIds = useMemo(() => allShipTabIds(tables), [tables])
  const activeTabs = tabs ?? allTabIds

  // Outside an event the game has no tag filter at all, so never leave a stale
  // tagged/untagged selection narrowing the list invisibly.
  const effectiveTag: ShipTagFilter = eventActive ? tag : 'all'

  // Roster ships carry no name of their own, so equipped-on labels resolve
  // through the master data already joined into the ship entries.
  const shipNames = useMemo(
    () => new Map(shipEntries.map(({ ship, $ship }) => [ship.api_id, $ship.api_name])),
    [shipEntries],
  )

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [mode])

  // Positions must come from the *full* list under the current filter, since
  // that is what the in-game picker paginates; the query only hides rows.
  const shipResults = useMemo((): Result<ShipEntry>[] => {
    if (mode !== 'ship') return []
    const list = buildShipList(
      shipEntries,
      { tabs: activeTabs, tag: effectiveTag, sortKey },
      tables,
    )
    const positions = shipPositions(list)
    const matched: Result<ShipEntry>[] = []
    for (const entry of list) {
      const name = entry.$ship.api_name
      // The reading is matched literally too, for anyone typing kana.
      if (!matchesName(query, name) && !matchesQuery(query, entry.$ship.api_yomi)) continue
      matched.push({ entry, position: positions.get(entry.ship.api_id) })
      if (matched.length >= MAX_RESULTS) break
    }
    return matched
  }, [mode, shipEntries, activeTabs, effectiveTag, sortKey, query, tables])

  // The ex-slot picker has no category tabs in game, so the category filter is
  // pinned to 全装備 (and disabled) while the ex-slot is selected.
  const slotLocksCategory = equipScope != null && equipSlot === EXTRA_SLOT
  const effectiveCategory = slotLocksCategory ? ALL_EQUIPS_CATEGORY : equipCategory

  const equipResults = useMemo((): EquipResult[] => {
    if (mode !== 'equip') return []
    const lists = buildEquipLists(
      equipEntries,
      {
        category: effectiveCategory,
        forShipMstId: equipScope?.shipMstId,
        forShipMemId: equipScope?.shipMemId,
        slot: equipScope ? (equipSlot ?? undefined) : undefined,
      },
      constState,
      tables,
    )
    const positions = equipListPositions(lists)
    // Results span both lists; each row carries the list it was numbered in.
    const matched: EquipResult[] = []
    for (const entry of [...lists.unset, ...lists.set]) {
      const name = entry.$equip.api_name
      if (!matchesName(query, name)) continue
      matched.push({ entry, position: positions.get(entry.equip.api_id) })
      if (matched.length >= MAX_RESULTS) break
    }
    return matched
  }, [mode, equipEntries, effectiveCategory, equipScope, equipSlot, constState, query, tables])

  const airbaseResults = useMemo((): Result<EquipEntry>[] => {
    if (mode !== 'airbase') return []
    const list = buildAirbaseList(equipEntries, { tab: airbaseTab }, tables)
    const positions = airbasePositions(list)
    const matched: Result<EquipEntry>[] = []
    for (const entry of list) {
      if (!matchesName(query, entry.$equip.api_name)) continue
      matched.push({ entry, position: positions.get(entry.equip.api_id) })
      if (matched.length >= MAX_RESULTS) break
    }
    return matched
  }, [mode, equipEntries, airbaseTab, tables, query])

  const toggleTab = useCallback(
    (id: number) =>
      setTabs((prev) => {
        const current = prev ?? allTabIds
        return current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
      }),
    [allTabIds],
  )

  // Mirrors the game's 全艦艇 button: all on, unless all are already on.
  const toggleAllTabs = useCallback(
    () => setTabs((prev) => ((prev ?? allTabIds).length === allTabIds.length ? [] : allTabIds)),
    [allTabIds],
  )

  // A query written for one roster rarely means anything against the other,
  // so switching modes starts from a clean search box.
  const changeMode = useCallback(
    (next: string) => {
      if (!isSearchMode(next)) return
      setQuery('')
      setMode(next)
    },
    [setMode],
  )

  const searchEquipsFor = useCallback((entry: ShipEntry) => {
    setEquipScope({
      shipMstId: entry.$ship.api_id,
      shipMemId: entry.ship.api_id,
      name: translateName(entry.$ship.api_name) || entry.$ship.api_name,
      slots: entry.ship.api_slotnum ?? 0,
      // 0 means the ex-slot was never opened; -1 is open and empty.
      hasExtra: (entry.ship.api_slot_ex ?? 0) !== 0,
    })
    setEquipSlot(null)
    setEquipCategory(ALL_EQUIPS_CATEGORY)
    setQuery('')
    setMode('equip')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const results = mode === 'ship' ? shipResults : mode === 'equip' ? equipResults : airbaseResults
  const allTabsOn = activeTabs.length === allTabIds.length

  return (
    <Panel
      $closing={closing}
      $noAnimation={noAnimation}
      onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
    >
      <SearchRow>
        <SegmentedControl
          value={mode}
          onValueChange={changeMode}
          options={[
            { value: 'ship', label: t('main:Ships') },
            { value: 'equip', label: t('main:Equip') },
            { value: 'airbase', label: t('main:Land base') },
          ]}
          intent="primary"
        />
        <SearchField>
          <InputGroup
            inputRef={inputRef}
            fill
            leftIcon="search"
            placeholder={t('main:Search by name or romaji')}
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Escape') onClose()
            }}
            rightElement={
              query ? (
                <Tooltip content={t('main:Clear search')} position={Position.TOP}>
                  <Button
                    minimal
                    icon="small-cross"
                    onClick={() => {
                      setQuery('')
                      inputRef.current?.focus()
                    }}
                  />
                </Tooltip>
              ) : undefined
            }
          />
        </SearchField>
        {/* Sort and secondary filters sit with the search box; the tab strip
            below is too wide to share this row. */}
        {mode === 'ship' && (
          <>
            {/* The picker cycles its sort key; the menu just makes the
                available keys visible instead of hiding them behind clicks. */}
            <FilterSelect
              value={sortKey}
              onSelect={setSortKey}
              width="8em"
              options={SHIP_SORT_KEYS.map((key) => ({
                value: key,
                label: translateSortCaption(SHIP_SORT_KEY_NAMES[key]),
              }))}
            />
            {/* The game only offers the sortie-tag filter while an event runs */}
            <FilterSelect
              value={tag}
              onSelect={setTag}
              disabled={!eventActive}
              width="9em"
              title={eventActive ? undefined : t('main:Available during events only')}
              options={[
                { value: 'all' as ShipTagFilter, label: t('main:All ships') },
                { value: 'tagged' as ShipTagFilter, label: t('main:Tagged') },
                { value: 'untagged' as ShipTagFilter, label: t('main:Untagged') },
              ]}
            />
          </>
        )}
        {mode === 'equip' && (
          <FilterSelect
            value={effectiveCategory}
            onSelect={setEquipCategory}
            disabled={slotLocksCategory}
            title={slotLocksCategory ? t('main:The ex-slot lists every equipment') : undefined}
            width="13em"
            options={tables.equipFilterCategories.map((category) => ({
              value: category.id,
              label: translateCaption(category.name),
              icon: category.icon,
            }))}
          />
        )}
        <Tooltip content={t('main:Close')} position={Position.TOP}>
          <Button minimal icon="cross" onClick={onClose} />
        </Tooltip>
      </SearchRow>

      {mode === 'ship' && (
        <FilterRow>
          <ButtonGroup>
            {shipFilterTabs(tables).map((tab) => (
              <TabButton
                key={tab.id}
                small
                $selected={activeTabs.includes(tab.id)}
                onClick={() => toggleTab(tab.id)}
              >
                {translateCaption(tab.name)}
              </TabButton>
            ))}
          </ButtonGroup>
          <TabButton small $selected={allTabsOn} onClick={toggleAllTabs}>
            {translateCaption('全艦艇')}
          </TabButton>
          <Tag minimal>{t('main:{{count}} shown', { count: results.length })}</Tag>
        </FilterRow>
      )}

      {/* A few ships bar particular equipment from particular slots, and the
          ex-slot has rules of its own, so the list is only exact once a slot is
          named. "Any" keeps the whole-ship view the scope opens on. */}
      {mode === 'equip' && equipScope && (
        <ScopeBar>
          <span>{t('main:Equippable by {{name}}', { name: equipScope.name })}</span>
          <SegmentedControl
            value={slotValue(equipSlot)}
            onValueChange={(next) => setEquipSlot(parseSlot(next))}
            options={[
              { value: 'any', label: t('main:Any slot') },
              ...Array.from({ length: equipScope.slots }, (_, slot) => ({
                value: String(slot),
                label: String(slot + 1),
              })),
              ...(equipScope.hasExtra ? [{ value: EXTRA_SLOT, label: t('main:Ex') }] : []),
            ]}
            intent="primary"
            size="small"
          />
          <Button
            small
            minimal
            icon="cross"
            onClick={() => {
              setEquipScope(null)
              setEquipSlot(null)
            }}
          >
            {t('main:Clear')}
          </Button>
          <Tag minimal>{t('main:{{count}} shown', { count: results.length })}</Tag>
        </ScopeBar>
      )}

      {mode === 'equip' && !equipScope && (
        <FilterRow>
          <Tag minimal>{t('main:{{count}} shown', { count: results.length })}</Tag>
        </FilterRow>
      )}

      {/* One tab at a time, as in game — a radio group rather than the ship
          strip's independent toggles. On its own row: five CJK captions do not
          share a line with the search box. */}
      {mode === 'airbase' && (
        <FilterRow>
          <SegmentedControl
            value={String(airbaseTab)}
            onValueChange={(next) => {
              const id = Number(next)
              if (Number.isFinite(id)) setAirbaseTab(id)
            }}
            options={tables.airbaseFilterTabs.map((tab) => ({
              value: String(tab.id),
              label: translateCaption(tab.name),
              icon: <PillIcon slotitemId={tab.icon} alt="" />,
            }))}
            intent="primary"
            size="small"
          />
          <Tag minimal>{t('main:{{count}} shown', { count: results.length })}</Tag>
        </FilterRow>
      )}

      <Results>
        {results.length === 0 ? (
          <Empty>{t('main:No matching entry')}</Empty>
        ) : mode === 'ship' ? (
          shipResults.map(({ entry, position }) => (
            <ShipResultRow
              key={entry.ship.api_id}
              entry={entry}
              position={position}
              enableAvatar={enableAvatar}
              avatarType={avatarType}
              shipTagColor={shipTagColor}
              inRepair={inRepair.has(entry.ship.api_id)}
              onSearchEquips={searchEquipsFor}
            />
          ))
        ) : mode === 'equip' ? (
          equipResults.map(({ entry, position }) => (
            <ResultRow key={entry.equip.api_id}>
              <RowIcon slotitemId={entry.$equip.api_type?.[3]} alt="" />
              <Name title={entry.$equip.api_name}>
                {translateName(entry.$equip.api_name) || entry.$equip.api_name}
                {(entry.equip.api_level ?? 0) > 0 && ` ★+${entry.equip.api_level}`}
              </Name>
              <Proficiency alv={entry.equip.api_alv} />
              <Meta>
                {entry.equippedOn
                  ? translateName(shipNames.get(entry.equippedOn)) || t('main:Equipped')
                  : t('main:In stock')}
              </Meta>
              {position && <ListModeTag mode={position.mode} />}
              <PositionTag position={position} />
            </ResultRow>
          ))
        ) : (
          airbaseResults.map(({ entry, position }) => {
            const deployment = airbaseDeployments.get(entry.equip.api_id)
            return (
              <ResultRow key={entry.equip.api_id}>
                <RowIcon slotitemId={entry.$equip.api_type?.[3]} alt="" />
                <Name title={entry.$equip.api_name}>
                  {translateName(entry.$equip.api_name) || entry.$equip.api_name}
                  {(entry.equip.api_level ?? 0) > 0 && ` ★+${entry.equip.api_level}`}
                </Name>
                <Proficiency alv={entry.equip.api_alv} />
                <Meta>
                  {deployment
                    ? `${deployment.baseName} · ${t('main:Squadron')} ${deployment.squadron}`
                    : t('main:In stock')}
                </Meta>
                <PositionTag position={position} />
              </ResultRow>
            )
          })
        )}
      </Results>
    </Panel>
  )
}

/**
 * Search overlay for the ship / equipment roster. Mounted once at the poi-app
 * root so it is reachable from anywhere, and scoped to the poi-app area so it
 * never covers the game view.
 */
/**
 * `closing` keeps the panel mounted for the exit animation, the same way the
 * plugin drawer does. Under 'Enable Smooth Transition' = off it is skipped
 * entirely and the overlay appears and disappears outright.
 */
type SearchState = 'closed' | 'open' | 'closing'

export const GlobalSearch = () => {
  const [state, setState] = useState<SearchState>('closed')
  const [mode, setMode] = useState<SearchMode>('ship')
  const accelerator = useSelector(
    (state: RootState) => state.config?.poi?.shortcut?.search ?? 'CmdOrCtrl+F',
  )
  const enableTransition = useSelector(
    (state: RootState): boolean => state.config?.poi?.transition?.enable ?? true,
  )
  const noAnimation = !enableTransition

  const handleOpen = useCallback((nextMode?: SearchMode) => {
    if (nextMode) setMode(nextMode)
    // Re-opening mid-dismissal cancels it rather than queueing a second cycle.
    setState('open')
  }, [])

  const handleClose = useCallback(
    () => setState((prev) => (prev === 'open' ? (noAnimation ? 'closed' : 'closing') : prev)),
    [noAnimation],
  )

  useSearchHotkey(accelerator, () =>
    setState((prev) => {
      if (prev === 'open') return noAnimation ? 'closed' : 'closing'
      return 'open'
    }),
  )

  useEffect(() => {
    const disposable = searchEventEmitter.on((e) => handleOpen(e.mode))
    return () => disposable.dispose()
  }, [handleOpen])

  useEffect(() => {
    if (state !== 'open') return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state, handleClose])

  if (state === 'closed') return null

  const closing = state === 'closing'

  return (
    <Backdrop
      className="global-search-backdrop"
      $closing={closing}
      $noAnimation={noAnimation}
      onMouseDown={handleClose}
      // The panel's animation drives the unmount; the backdrop's is the same
      // length, so either finishing is a fine cue.
      onAnimationEnd={
        !noAnimation && closing
          ? (e: React.AnimationEvent<HTMLDivElement>) => {
              if (e.target === e.currentTarget) {
                setState((prev) => (prev === 'closing' ? 'closed' : prev))
              }
            }
          : undefined
      }
    >
      <GlobalSearchPanel
        mode={mode}
        setMode={setMode}
        onClose={handleClose}
        closing={closing}
        noAnimation={noAnimation}
      />
    </Backdrop>
  )
}
