# Launch-day account move — plan only

No launch export, import, cross-project connection or password transfer has been
built or executed. This document is for a future, separately approved move.

## Boundaries

Katherine authorizes the batch at launch. Work on sanitized copies first, then
review counts, conflicts and recovery steps before touching live accounts.
The free app must never hold credentials for the full app's database.
Each app's agent works only in its own project.

## Proposed secure export

Use an owner-authorized offline administrative process, not the leads CSV,
browser downloads or email attachments. Export only the selected waitlist batch:
normalized email, first name, existing bcrypt password hash (never a plaintext
password), consent, signup timestamp, waitlist timestamp and full `rcstate` /
`setaside` envelopes in the format documented in `ANSWER_FORMAT.md`.
Preserve nullable and optional fields, redo rounds and original strings.
Exclude sessions, reset tokens, owner roles, recovery caches and unrelated data.

Encrypt the export for the receiving operator, transfer through an approved
private channel with short-lived access, log only counts/checksums and destroy
temporary decrypted copies after acceptance. No secret, hash or answer contents
belong in Git, agent chat or application request logs.

## Validate on copies

1. Verify both answer contracts and bcrypt cost/algorithm compatibility.
2. Validate every envelope/payload without discarding unknown legacy fields.
3. Produce counts for eligible, valid, invalid, duplicate and conflicting rows.
4. Map free IDs to fresh full-app IDs; rewrite ownership only, not answer text.
5. Simulate sign-in, review, resume, completion and account-isolation behavior.
6. Check that an import replay changes nothing (batch identity and row checksums).
7. Verify that consent false remains false and imported clients are never owners.

Use synthetic accounts with known chosen test passwords to establish hash
compatibility. If compatibility fails, stop and design an explicit reset flow;
never generate substitute passwords or email plaintext passwords.

## Existing email conflict policy

Normalize email consistently. Never overwrite a full-app account's password,
name, consent, role or answers merely because its email matches an exported row.
Record matching accounts in a conflict manifest for Katherine's review.
Require proof of account ownership and explicit approval before linking.

For an approved link, retain the existing full-app credentials and full-app
answers by default. Import free RC only when the destination has no RC data and
the user explicitly accepts it. If both have RC, preserve both securely for
review rather than selecting a winner by modification timestamp. Never downgrade
consent or turn false into true implicitly; reconcile scope with explicit consent.
Name changes are suggestions, not silent overwrites.

## Live batch, only after separate approval

- Confirm backups, exact target database and a maintenance/reconciliation window.
- Export a final consistent eligible snapshot; define treatment of late signups.
- In the full project, execute an atomic transaction per batch with unique
  import-row identities and an audited free-ID → full-ID map.
- New imported accounts receive client role and their compatible existing hash.
  Existing sessions are not copied.
- Check counts and payload checksums before committing. Test with approved
  synthetic rows before processing real rows.
- Release new access only after sign-in, RC review and cache-ownership checks.
- Announce through a separately authorized mailing process honoring consent;
  no email service or campaign is part of the current free-app implementation.

## Recovery

Before committing, rollback the transaction on any mismatch. After commit,
use the import manifest to reverse only untouched newly imported records.
Never delete user activity created after import; use a reviewed restore/merge
process for those accounts. Retain the source free accounts and answers until
Katherine explicitly approves a retention/deletion policy.
