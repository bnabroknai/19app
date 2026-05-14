# OneSpirit Security Specification - Shard Protocol

## 1. Data Invariants
- A journal entry cannot exist without a matching User ID.
- Users can only read their own profile and journal.
- Daily content is read-only for all users and write-restricted to admins.
- Days completed must increment sequentially (soft-enforced by client, hard-enforced via rules).
- Timestamps must be server-generated.

## 2. The Dirty Dozen Payloads (Rejected)
1. **Identity Spoofing**: Attempting to create a `journal_entry` with a different `userId`.
2. **State Shortcutting**: Attempting to set `currentDay` to 19 on Day 1 without gradual progression.
3. **Resource Poisoning**: Large 1MB strings in the `prayer` field of `daily_content` (blocked for users).
4. **Email Spoofing**: Accessing data as an unverified user.
5. **PII Leak**: Querying for all user profiles.
6. **Relational Sync**: Creating a journal entry for a day that hasn't been reached yet.
7. **Ghost Keys**: Adding `isVerified: true` to a user document.
8. **Orphaned Writes**: Creating a journal entry for a nonexistent user.
9. **Terminal State**: Modifying a finished cycle's records (future scope).
10. **Admin Elevation**: Trying to write into `daily_content`.
11. **Negative Cycles**: Setting `currentCycle` to -1.
12. **Anonymous Chaos**: Accessing the platform without auth.

## 3. Test Runner (Conceptual)
Verified via manual teardown and simulation of restricted payloads.
