/*
   Item development & improvement prophecy
 */
const {success, warn, i18n, getStore} = window
const __ = i18n.main.__.bind(i18n.main)

const lookupItemName = slotitemId =>
  i18n.resources.__(
    getStore(['const', '$equips', slotitemId, 'api_name'], 'unknown')
  )

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
        warnAfterDelay(__("The development of %s was failed.", name), devResultDelay)
      } else if (body.api_create_flag === 1) {
        const name = lookupItemName(body.api_slot_item.api_slotitem_id)
        successAfterDelay(__("The development of %s was successful.", name), devResultDelay)
      }
    }

    if (path === '/kcsapi/api_req_kousyou/remodel_slot') {
      // body.api_remodel_id = [<slot id before>, <slot id after>]
      const [eqpIdBefore] = body.api_remodel_id
      const name = lookupItemName(eqpIdBefore)
      if (body.api_remodel_flag === 0) {
        warnAfterDelay(__("The improvement of %s was failed.", name), improveResultDelay)
      } else if (body.api_remodel_flag === 1) {
        successAfterDelay(__("The improvement of %s was successful.", name), improveResultDelay)
      }
    }
  }
)
