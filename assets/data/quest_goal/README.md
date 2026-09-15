# Quest goals

The quest-tracking definitions poi uses. Every `*.cson` in this directory is merged into one
table — at runtime as the bundled fallback (`views/redux/info/quests/goals.ts`), and by
`node fcd/build.js` into the single fcd payload `assets/data/fcd/questgoal.json`.

After editing a file here, run `node fcd/build.js` and commit the regenerated payload; `npm test`
fails if the two drift apart (`fcd/__tests__/payloads.spec.ts`).

External tools that read quest goals should use `assets/data/fcd/questgoal.json`: the same data
as one plain JSON file, with the table under `data`.

## Files

A quest's file names its period, and `fcd/build.js` asserts that its `type` agrees:

| File                                | `type`                                   |
| ----------------------------------- | ---------------------------------------- |
| `daily.cson`                        | 1 (8/9 for the two special dailies)      |
| `weekly.cson`                       | 2                                        |
| `monthly.cson`                      | 3                                        |
| `quarterly.cson`                    | 4                                        |
| `yearly-01.cson` … `yearly-12.cson` | 101 … 112 (reset month)                  |
| `one-time.cson`, `one-time-*.cson`  | none — one-time quests never reset       |
| `limited-time.cson`                 | whatever period the game gives the quest |

A quest id may appear in only one file. The schema (events, filters, ship ids) is documented
in `skills/quest-goal-data/SKILL.md`.

## References

- Quest type, detail: https://wikiwiki.jp/kancolle/%E4%BB%BB%E5%8B%99
- Quest ID: https://raw.githubusercontent.com/antest1/kcanotify-gamedata/refs/heads/master/files/quests-jp.json
- Quest guides (ぜかましねっと): https://zekamashi.net/kancolle-kouryaku/
- Quest guides (となはざな): https://tonahazana.com/
