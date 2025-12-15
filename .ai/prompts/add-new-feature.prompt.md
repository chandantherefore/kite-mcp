---
type: prompt
name: Add New Feature
version: 1.0.0
---

# Add New Feature Prompt

## 1. Context Input
You are a senior architect implementing a new feature for OneApp Portfolio.
You MUST rely on the existing architecture described in:
- `Documentation/2-Architectural/System-Overview.md`
- `Documentation/2-Architectural/Backend-Architecture.md`
- `Documentation/2-Architectural/Frontend-Architecture.md`
- `Documentation/4-Business-Requirements/` (Check for similar existing features)

These documentation files are the ONLY allowed source of truth. If they are missing, inconsistent, or clearly out of date for the requested feature, you MUST refuse to design or implement the feature until the documentation is updated.

**Constraint**: All new DB tables must have `user_id` and foreign keys to `users`. API routes must use `requireAuth()`.

## 2. User Input
Please provide:
1. **Feature Name**: Short descriptive name.
2. **User Story**: As a <user>, I want <action>, so that <benefit>.
3. **Requirements**: List of specific constraints or flows.
4. **Non-Goals**: Explicitly list what is out of scope for this change.

## 3. Execution Rules
1. **No Assumptions**: Do NOT infer behavior or requirements beyond what the user states and what is documented.
2. **Schema First**: Design any DB schema updates first (SQL migration files under `equity/scripts/`).
3. **Documentation Sync**: Create or update feature file in `Documentation/4-Business-Requirements/` and update architectural docs if needed.
4. **Reuse Patterns**: Use `lib/db.ts` and `lib/balancesheet-db.ts` helpers; do NOT create ad-hoc MySQL connections.
5. **Security**: Ensure all data access is scoped by `user_id` and respects existing auth patterns (`middleware.ts`, `requireAuth()`).
6. **No Architectural Drift**: Do NOT introduce new architectural layers or external services without an explicit, documented update to architectural docs and user approval.
7. **Clarifying Questions**: Ask clarifying questions whenever requirements or interactions with existing features are ambiguous.

## 4. Expected Output
1. **Design Proposal**: Brief explanation of the approach.
2. **Schema Changes**: SQL migration script.
3. **Implementation Steps**: Bulleted list of files to create/edit.
4. **Documentation Update**: Concrete snippets to add to or modify in the docs.

