import { EventEmitter } from 'views/utils/event-emitter'

export type SearchMode = 'ship' | 'equip'

export interface SearchOpenEvent {
  /** Mode to open in; omitted keeps whatever the bar was last using. */
  mode?: SearchMode
}

/**
 * The search bar lives at the poi-app root, so anything (the admiral panel
 * button, the hotkey, a plugin) can open it without owning the component.
 */
export const searchEventEmitter = new EventEmitter<SearchOpenEvent>()

export const openGlobalSearch = (mode?: SearchMode) => searchEventEmitter.emit({ mode })
