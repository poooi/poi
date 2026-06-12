import _ from 'lodash'
import { getStore } from 'views/create-store'
import { config } from 'views/env'
import { isGameResponse } from 'views/env-parts/data-resolver'
import i18next from 'views/env-parts/i18next'
import { warn, success } from 'views/services/alert'

const lookupItemName = (slotitemId: number) =>
  i18next.t(`resources:${getStore(`const.$equips.${slotitemId}.api_name`) ?? 'unknown'}`, {
    keySeparator: '%%%%',
  })

const devResultDelay = config.get('poi.notify.delay.dev', false) ? 6200 : 500

const improveResultDelay = config.get('poi.notify.delay.improve', false) ? 5500 : 500

window.addEventListener('game.response', (e) => {
  if (isGameResponse(e, '/kcsapi/api_req_kousyou/createitem')) {
    const { body } = e.detail
    if (body.api_create_flag === 0) {
      setTimeout(warn, devResultDelay, i18next.t('main:DevelopFailed'))
    } else if (body.api_create_flag === 1) {
      const name = _(body.api_get_items)
        .filter((item) => (item?.api_slotitem_id ?? 0) > 0)
        .map((item) => lookupItemName(item.api_slotitem_id))
        .join(' | ')
      setTimeout(success, devResultDelay, i18next.t('main:DevelopSuccess', { name }))
    }
  }

  if (isGameResponse(e, '/kcsapi/api_req_kousyou/remodel_slot')) {
    const { body } = e.detail
    const [eqpIdBefore] = body.api_remodel_id
    const name = lookupItemName(eqpIdBefore)
    if (body.api_remodel_flag === 0) {
      setTimeout(warn, improveResultDelay, i18next.t('main:ImproveFailed', { name }))
    } else if (body.api_remodel_flag === 1) {
      setTimeout(success, improveResultDelay, i18next.t('main:ImproveSuccess', { name }))
    }
  }
})
