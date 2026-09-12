import fs from 'fs'
import path from 'path'

/**
 * `fcd/build.js` mirrors each source into `assets/data/fcd/<name>.json`. If a source
 * is edited without re-running the build, the committed payload goes stale — and a
 * stale payload is not harmless: poi layers the delivered table over the bundled
 * data, so a quest fix in the cson can lose to the payload it should have produced.
 * Run `node fcd/build.js` and commit the result when this fails.
 */
const ROOT = path.resolve(__dirname, '..', '..')

const PAYLOADS: Array<{ name: string; source: string }> = [
  { name: 'questgoal', source: 'assets/data/quest_goal.cson' },
  { name: 'shiptag', source: 'fcd/shiptag.cson' },
  { name: 'map', source: 'fcd/map.json' },
  { name: 'shipavatar', source: 'fcd/shipavatar.json' },
]

// `lib/__mocks__/cson.ts` is picked up automatically for this node module, and a
// stubbed parser would make the comparison below vacuous.
const CSON = jest.requireActual<{ parse: (text: string) => unknown }>('cson')

interface Payload {
  meta: { name?: unknown; version?: unknown }
  data: unknown
}

const isPayload = (value: unknown): value is Payload =>
  typeof value === 'object' && value !== null && 'meta' in value && 'data' in value

const read = (relative: string): unknown => {
  const text = fs.readFileSync(path.join(ROOT, relative), 'utf-8')
  // CSON returns parse errors instead of throwing them
  const parsed: unknown = relative.endsWith('.cson') ? CSON.parse(text) : JSON.parse(text)
  if (parsed instanceof Error) throw parsed
  return parsed
}

describe('assets/data/fcd payloads are in step with their sources', () => {
  it.each(PAYLOADS)('$name.json matches $source', ({ name, source }) => {
    const payload = read(`assets/data/fcd/${name}.json`)
    if (!isPayload(payload)) throw new Error(`assets/data/fcd/${name}.json has no meta/data`)
    expect(payload.meta).toMatchObject({ name, version: expect.any(String) })
    expect(payload.data).toEqual(read(source))
  })

  it('meta.json lists every payload', () => {
    const dir = path.join(ROOT, 'assets/data/fcd')
    const files = fs.readdirSync(dir).filter((file) => file !== 'meta.json')
    const meta: unknown = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf-8'))
    if (!Array.isArray(meta)) throw new Error('meta.json is not an array')
    const names = meta.map((entry) =>
      typeof entry === 'object' && entry !== null && 'name' in entry ? entry.name : undefined,
    )
    expect(names.sort()).toEqual(files.map((file) => file.replace('.json', '')).sort())
  })
})
