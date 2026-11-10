# Reality Check answer contract

This free app uses the inherited full-app contract unchanged. Free signup, email
consent and waitlist membership are **not** Reality Check answers.

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
| `mirror` | array of existing mirror statement IDs; keep IDs and order |
| `phoneMirror` | optional `{set:0\|1, viewedBoth:boolean}` |
| `areaCounts` | `{self:number,time:number,wealth:number}` |
| `defaultCounts` | `{avoiding:number,blaming:number,carrying:number,hoping:number}` |
| `focus` | `"self"\|"time"\|"wealth"\|null` |
| `focusChosenBy` | `"revealed"\|"tie-picked"\|"changed"\|null` |
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

Empty fields stay empty, numeric zero remains a real value, and omitted optional
fields are not silently converted into fabricated answers. Existing normalization,
completion, review and 90-day redo semantics remain authoritative.

## Poster and ending mappings

- Large Future B words: `futureB1.doing` (the one-year letter's original answer).
- Tuesday line: `futureB5.tuesday` (the original Future B Tuesday answer).
- Old road cost: `cost.hoursPerWeek`, `cost.monthly`, `cost.you`, when present.
- First action: `futureB1.oneThing`.
- Name: account `firstName`; date: completion/start date.
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
