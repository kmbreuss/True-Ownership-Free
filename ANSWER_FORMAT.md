# Reality Check answer contract

This free app uses the inherited full-app contract, **extended additively by free course v2 (2026-11-11)**: every field below still exists with its original shape; the new fields listed under "Free course v2 fields" sit alongside them. Free signup, email
consent and waitlist membership are **not** Reality Check answers.

> **Compatibility change, flagged for Katherine:** `rcConstants.ts` (shared with the full app) gains optional fields and 24 more mirror statements. An older reader that normalises a new-flow answer drops the new fields (see "Older readers"). Nothing is renamed or removed.

## Storage and sync

- Browser Reality Check store: `to_rc_state_v1`.
- Server `user_data` key: `rcstate`, owned by `user_id`.
- Server envelope: `{ "t": <epoch milliseconds>, "v": <RCState> }`.
- Payload `version` remains **2**, despite the stable `_v1` browser key.
- `to_sync_meta_v1` holds per-store local modification times for conflict handling.
- Completion handoff: browser `to_setaside_v1`, server key `setaside`, envelope
  `{t,v}`, payload `{version:1, items:[...]}`. Item fields include `id`, `text`,
  `source`, `round`, `createdAt`; preserve any other existing item metadata.
- Only `rcstate` and `setaside` can be written through this free app's userdata API.
- All reads/writes retain the cache-owner boundary; server PUT requires
  `X-Account-Id` equal to the current session user. Never import another user's
  browser caches, or upload unowned recovery copies.

## RCState fields

| Field | Exact value shape |
|---|---|
| `version` | `2` |
| `step` | integer `0..13`; Opening and Person A/B share step `0` |
| `maxReached` | optional integer `0..13`, monotonic reached evidence |
| `startedAt`, `completedAt` | ISO timestamp string or `null` |
| `mirror` | array of mirror statement IDs (the original 12 or the 24 added ones, 36 in all); keep IDs and order |
| `phoneMirror` | optional `{set:0\|1, viewedBoth:boolean}` |
| `areaCounts` | `{self:number,time:number,wealth:number}` |
| `defaultCounts` | `{avoiding:number,blaming:number,carrying:number,hoping:number}` |
| `focus` | `"self"\|"time"\|"wealth"\|null` |
| `focusChosenBy` | `"revealed"\|"tie-picked"\|"changed"\|"picked"\|null` (`"picked"` is new: the reader chose the area on FC-03) |
| `topDefaults` | array of `"avoiding"\|"blaming"\|"carrying"\|"hoping"` |
| `tuesday` | string |
| `defaultsNamed` | `{avoiding:string,blaming:string,carrying:string,hoping:string}` |
| `defaultsTogether` | optional string; explicitly blank is different from absent |
| `cost` | `{monthly:number\|null,moneyWhere:string,hoursPerWeek:number\|null,hoursWhere:string,you:string,whoElse:string,youAmount?:"a little"\|"a lot"\|"most of me"}` |
| `futureA` | `{extra:string}` |
| `compound` | `{feels:string[],results:string,whoElse:string}` |
| `futureB5` | `{feels:string[],tuesday:string,whoNotices:string}` |
| `futureB1` | `{doing:string,oneThing:string}` |
| `choice` | `"A"\|"B"\|null` |
| `willing` | `"yes"\|"not-yet"\|null` |
| `notYetWhy` | string |
| `complete` | boolean |
| `rounds` | array of completed RCState snapshots, without nested `rounds` |

## Free course v2 fields (all optional)

Absent on every answer saved before the course. Kept by `normalizeRC` only when present and valid; unknown keys are still dropped.

| Field | Exact value shape | Written by |
|---|---|---|
| `fcScreen` | integer `0..26` (clamped): the course screen the reader is on. `26` is the waitlist ending. Its presence means "this answer uses the new course". | every course screen |
| `pattern` | `"avoiding"\|"blaming"\|"carrying"\|"hoping"` — the reader's main pattern | FC-07 |
| `patternCounts` | `{avoiding,blaming,carrying,hoping: number}` over the 36 statements | FC-07 |
| `patternChosenBy` | `"revealed"\|"tie-picked"` (a tie requires the reader to pick the truer one) | FC-07 |
| `oneThing` | string: the one thing they have been carrying/hoping/etc. | FC-08 |
| `underneath` | `"fear"\|"guilt"\|"shame"\|"loss"\|"other"` | FC-09 |
| `underneathOther` | string (used when `underneath` is `"other"`) | FC-09 |
| `partIOwn` | string | FC-12 |
| `futureAPath` | `{month,year,threeYears: string}` — what is still the same | FC-13 |
| `futureBPath` | `{month,year,threeYears: string}` — what they do instead | FC-15 |
| `futureBScene` | `{morning,work,family,people,money: string (tile id or typed text), feels: string[], ownWords: string}` | FC-16 |
| `firstStep` | string, kept equal to `futureB1.oneThing` | FC-18 / letter |

Mirrored into existing fields (so the poster, ending and old readers keep working): the composed Future B line is written to `futureB5.tuesday` and the chosen feelings to `futureB5.feels`; `topDefaults` and `defaultsNamed[pattern]` follow `pattern`/`oneThing`; `futureB1.oneThing` and `firstStep` are always equal.

Cost maths on FC-13, FC-15 and FC-17: weeks map month = weekly hours × 4, year × 52, three years × 156; money is monthly × 1, × 12, × 36. A blank cost is omitted, never shown as 0.

Step mapping: `step` still runs `0..13` and moves monotonically with the course (`FC-18` to `FC-21` sit at `12`; step `13` is the ending only). Answers saved before the course (no `fcScreen`) continue in the original screens. A redo or review of a new-flow answer starts the course again at FC-01.

### Older readers

A reader that only knows the baseline shape (`0fea2a2`) keeps every original field and drops the new ones, including `focusChosenBy: "picked"` (becomes `null`) and any of the 24 added statement ids in `mirror`. The free-path check proves this (`scripts/rc-normalize-check.ts`). An answer saved before the course normalises byte-for-byte as it did.

### The 36 mirror statements

`RC_MIRROR` (the original 12, ids unchanged) plus `RC_MIRROR_EXTRA` (24, ids like `time-hoping-2`); `RC_MIRROR_ALL` is the 36: three per pattern in each of Self, Time and Wealth. Tags are never shown to the reader. Source list: `docs/free-v2/Free_Course_36_Statements.md`.

Empty fields stay empty, numeric zero remains a real value, and omitted optional
fields are not silently converted into fabricated answers. Existing normalization,
completion, review and 90-day redo semantics remain authoritative.

## Poster and ending mappings

- Large Future B words: `futureB1.doing` (the one-year letter's original answer).
- Tuesday line: `futureB5.tuesday` (the original Future B Tuesday answer).
- Old road cost: `cost.hoursPerWeek`, `cost.monthly`, `cost.you`, when present.
- First action: `futureB1.oneThing`.
- Name: account `firstName`; date: completion/start date.
- On a new-flow answer the Future B line is the composed scene line (`futureB5.tuesday`); the hours are weekly × 52 (a year).
- User words are rendered, never rewritten or saved back from poster formatting.
- Missing answers are omitted. PNG is 1080×1920; no PDF is required for this ship.
- If exceptionally long content cannot fit even at the readable poster minimum,
  download fails explicitly rather than clipping or truncating saved words.

## Free-only account metadata

On `users`, not inside `rcstate`: `email_consent` boolean (unchecked by default),
`waitlisted_at` nullable server timestamp, and inherited account fields including
`first_name`, `email`, `created_at`. Waitlist membership is represented by a
non-null timestamp; repeated joins keep the first date.

Any future answer-format change requires updating this file and
`CHANGES_FOR_FULL_APP.md` and explicitly flagging the compatibility change to
Katherine before implementation.
