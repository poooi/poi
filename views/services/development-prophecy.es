/*
   Item development & improvement prophecy
 */
import i18next from 'views/env-parts/i18next'

const {success, warn, getStore} = window

const lookupItemName = slotitemId =>
  i18next.t(`resources:${getStore(['const', '$equips', slotitemId, 'api_name'], 'unknown')}`, { keySeparator: '%%%%' })

const devResultDelay =
  window.config.get('poi.delayItemDevResult', false) ? 6200 : 500

const improveResultDelay =
  window.config.get('poi.delayItemImproveResult', false) ? 5500 : 500

const sendAfterDelay = sender => (msgStr, delay) =>
  setTimeout(
    sender.bind([], msgStr),
    delay,
  )

const successAfterDelay = sendAfterDelay(success)
const warnAfterDelay = sendAfterDelay(warn)

window.addEventListener('game.response',
  ({detail: {path, body}}) => {
    if (path === '/kcsapi/api_req_kousyou/createitem') {
      if (body.api_create_flag === 0) {
        const name = lookupItemName(body.api_fdata.split(',')[1])
        warnAfterDelay(i18next.t("main:DevelopFailed", {name}), devResultDelay)
      } else if (body.api_create_flag === 1) {
        const name = lookupItemName(body.api_slot_item.api_slotitem_id)
        successAfterDelay(i18next.t("main:DevelopSuccess", {name}), devResultDelay)
      }
    }

    if (path === '/kcsapi/api_req_kousyou/remodel_slot') {
      // body.api_remodel_id = [<slot id before>, <slot id after>]
      const [eqpIdBefore] = body.api_remodel_id
      const name = lookupItemName(eqpIdBefore)
      if (body.api_remodel_flag === 0) {
        warnAfterDelay(i18next.t("main:ImproveFailed", {name}), improveResultDelay)
      } else if (body.api_remodel_flag === 1) {
        successAfterDelay(i18next.t("main:ImproveSuccess", {name}), improveResultDelay)
      }
    }
  }
)
