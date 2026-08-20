import type { RootState } from 'views/redux/reducer-factory'
import type {
  EquipEntry,
  EquipListMode,
  EquipListPosition,
  SelectorPosition,
  ShipEntry,
  ShipSortKey,
  ShipTagFilter,
} from 'views/utils/game-selector'

import { Button, ButtonGroup, InputGroup, SegmentedControl, Tag } from '@blueprintjs/core'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import i18next from 'views/env-parts/i18next'
import {
  ALL_EQUIPS_CATEGORY,
  allShipTabIds,
  buildEquipLists,
  buildShipList,
  equipListPositions,
  shipFilterTabs,
  SHIP_SORT_KEY_NAMES,
  SHIP_SORT_KEYS,
  isEventActive,
  shipPositions,
} from 'views/utils/game-selector'
import { matchesRomaji } from 'views/utils/kana'
import { constSelector, mapsSelector } from 'views/utils/selectors'

import { equipEntriesSelector, selectorTablesSelector, shipEntriesSelector } from './entries'
import { searchEventEmitter, type SearchMode } from './event'
import {
  Backdrop,
  Empty,
  FilterRow,
  FilterSelect,
  ListModeTagEl,
  Meta,
  Name,
  Panel,
  PositionTagEl,
  Results,
  ResultRow,
  ScopeBar,
  SearchField,
  SearchRow,
  SortButton,
  TabButton,
} from './styles'
import { useSearchHotkey } from './use-search-hotkey'

/** Cap the rendered rows: the list is a lookup aid, not a browsable roster. */
const MAX_RESULTS = 60

const translateName = (name: string | undefined): string =>
  name ? i18next.t(`resources:${name}`, { keySeparator: 'chiba' }) : ''

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

interface Result<T> {
  entry: T
  position: SelectorPosition | undefined
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
}

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
  const [equipScope, setEquipScope] = useState<EquipScope | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const shipEntries = useSelector(shipEntriesSelector)
  const equipEntries = useSelector(equipEntriesSelector)
  const constState = useSelector(constSelector)
  const maps = useSelector(mapsSelector)
  const tables = useSelector(selectorTablesSelector)
  const eventActive = isEventActive(maps)

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
      const yomi = entry.$ship.api_yomi
      if (
        !matchesQuery(query, name, translateName(name), yomi) &&
        !matchesRomaji(query, yomi) &&
        !matchesRomaji(query, name)
      ) {
        continue
      }
      matched.push({ entry, position: positions.get(entry.ship.api_id) })
      if (matched.length >= MAX_RESULTS) break
    }
    return matched
  }, [mode, shipEntries, activeTabs, effectiveTag, sortKey, query, tables])

  const equipResults = useMemo((): EquipResult[] => {
    if (mode !== 'equip') return []
    const lists = buildEquipLists(
      equipEntries,
      {
        category: equipCategory,
        forShipMstId: equipScope?.shipMstId,
        forShipMemId: equipScope?.shipMemId,
      },
      constState,
      tables,
    )
    const positions = equipListPositions(lists)
    // Results span both lists; each row carries the list it was numbered in.
    const matched: EquipResult[] = []
    for (const entry of [...lists.unset, ...lists.set]) {
      const name = entry.$equip.api_name
      if (!matchesQuery(query, name, translateName(name)) && !matchesRomaji(query, name)) continue
      matched.push({ entry, position: positions.get(entry.equip.api_id) })
      if (matched.length >= MAX_RESULTS) break
    }
    return matched
  }, [mode, equipEntries, equipCategory, equipScope, constState, query, tables])

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

  const cycleSortKey = useCallback(
    () =>
      setSortKey(
        (prev) => SHIP_SORT_KEYS[(SHIP_SORT_KEYS.indexOf(prev) + 1) % SHIP_SORT_KEYS.length],
      ),
    [],
  )

  // A query written for one roster rarely means anything against the other,
  // so switching modes starts from a clean search box.
  const changeMode = useCallback(
    (next: string) => {
      if (next !== 'ship' && next !== 'equip') return
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
    })
    setEquipCategory(ALL_EQUIPS_CATEGORY)
    setQuery('')
    setMode('equip')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const results = mode === 'ship' ? shipResults : equipResults
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
          ]}
          intent="primary"
          size="small"
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
                <Button
                  minimal
                  small
                  icon="small-cross"
                  title={t('main:Clear search')}
                  onClick={() => {
                    setQuery('')
                    inputRef.current?.focus()
                  }}
                />
              ) : undefined
            }
          />
        </SearchField>
        {/* Sort and secondary filters sit with the search box; the tab strip
            below is too wide to share this row. */}
        {mode === 'ship' ? (
          <>
            <SortButton small icon="sort" onClick={cycleSortKey}>
              {translateSortCaption(SHIP_SORT_KEY_NAMES[sortKey])}
            </SortButton>
            {/* The game only offers the sortie-tag filter while an event runs */}
            <FilterSelect
              value={tag}
              disabled={!eventActive}
              title={eventActive ? undefined : t('main:Available during events only')}
              onChange={(e) => {
                const next = e.currentTarget.value
                if (next === 'all' || next === 'tagged' || next === 'untagged') setTag(next)
              }}
              options={[
                { value: 'all', label: t('main:All ships') },
                { value: 'tagged', label: t('main:Tagged') },
                { value: 'untagged', label: t('main:Untagged') },
              ]}
            />
          </>
        ) : (
          <FilterSelect
            $wide
            value={equipCategory}
            onChange={(e) => {
              const next = Number(e.currentTarget.value)
              if (Number.isFinite(next)) setEquipCategory(next)
            }}
            options={tables.equipFilterCategories.map((category) => ({
              value: category.id,
              label: translateCaption(category.name),
            }))}
          />
        )}
        <Button minimal icon="cross" onClick={onClose} title={t('main:Close')} />
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

      {mode === 'equip' && equipScope && (
        <ScopeBar>
          <span>{t('main:Equippable by {{name}}', { name: equipScope.name })}</span>
          <Button small minimal icon="cross" onClick={() => setEquipScope(null)}>
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

      <Results>
        {results.length === 0 ? (
          <Empty>{t('main:No matching entry')}</Empty>
        ) : mode === 'ship' ? (
          shipResults.map(({ entry, position }) => (
            <ResultRow key={entry.ship.api_id}>
              <Name title={entry.$ship.api_name}>
                {translateName(entry.$ship.api_name) || entry.$ship.api_name}
              </Name>
              <Meta>
                Lv.{entry.ship.api_lv ?? 0} · HP {entry.ship.api_nowhp ?? 0}/
                {entry.ship.api_maxhp ?? 0}
              </Meta>
              <Button
                small
                minimal
                icon="cog"
                title={t('main:Search equipment for this ship')}
                onClick={() => searchEquipsFor(entry)}
              />
              <PositionTag position={position} />
            </ResultRow>
          ))
        ) : (
          equipResults.map(({ entry, position }) => (
            <ResultRow key={entry.equip.api_id}>
              <Name title={entry.$equip.api_name}>
                {translateName(entry.$equip.api_name) || entry.$equip.api_name}
                {(entry.equip.api_level ?? 0) > 0 && ` ★+${entry.equip.api_level}`}
              </Name>
              <Meta>
                {entry.equippedOn
                  ? translateName(shipNames.get(entry.equippedOn)) || t('main:Equipped')
                  : t('main:In stock')}
              </Meta>
              {position && <ListModeTag mode={position.mode} />}
              <PositionTag position={position} />
            </ResultRow>
          ))
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
