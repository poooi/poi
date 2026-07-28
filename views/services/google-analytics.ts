// Renderer half of the GA4 integration: the admiral's member id only exists in the
// renderer store, so we watch it here and hand it to the main-process collector.
// All transport lives in lib/analytics.ts.
import type * as analyticsType from 'lib/analytics'

import * as remote from '@electron/remote'
import { observer, observe } from 'redux-observers'
import { store, getStore } from 'views/create-store'

const analytics: typeof analyticsType = remote.require('./lib/analytics')

const handleMemberIdChange = (memberId: string | undefined) => {
  analytics.setUserId(memberId)
}

const memberIdObserver = observer(
  (state: { info: { basic: { api_member_id?: string } } }) => state.info.basic.api_member_id,
  (dispatch, current: string | undefined) => handleMemberIdChange(current),
)

// The store may already be populated when this service loads (plugin reload, devtools
// reload), in which case the observer would not fire for the existing value.
const initialMemberId = getStore('info.basic.api_member_id')
if (initialMemberId) {
  handleMemberIdChange(String(initialMemberId))
}

observe(store, [memberIdObserver])
