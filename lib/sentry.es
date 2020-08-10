import * as Sentry from '@sentry/electron'
import { isString, includes, get, each, takeRight, split } from 'lodash'
import path from 'path'

export const init = ({ build, paths }) => {
  const fromatRelative = (url) => {
    if (url.startsWith('app://')) {
      return url
    }

    let result = url
    each(paths, (parent) => {
      if (url.startsWith(parent)) {
        const relative = path.relative(parent, url)
        if (!relative.startsWith('..')) {
          result = relative
          return false // this terminates `each`
        }
      }
    })
    if (path.isAbsolute(result)) {
      return takeRight(split(result, path.sep), 3).join(path.sep)
    }
    return result
  }

  Sentry.init({
    dsn: 'https://bc58c4a7f37a43e8aa89ba9097536c84@sentry.io/1250935',
    beforeSend(event) {
      if (
        includes(
          get(event, 'exception.mechanism.data.message'),
          'React is running in production mode',
        )
      ) {
        return null
      }

      each(get(event, 'exception.values'), (value) => {
        each(get(value, 'stacktrace.frames'), (frame) => {
          if (frame.filename) {
            frame.filename = fromatRelative(frame.filename)
          }
        })
      })

      // console.log(util.inspect(event, { depth: null }))
      return event
    },
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'console') {
        return null
      }

      return breadcrumb
    },
  })

  Sentry.configureScope((scope) => {
    scope.setTag('build', isString(build) ? build.substring(0, 8) : 'DEV')
  })
}
