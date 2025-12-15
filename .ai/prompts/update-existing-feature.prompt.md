---
type: prompt
name: Update Existing Feature
version: 1.0.0
---

# Update Existing Feature Prompt

## 1. Context Input
You are maintaining the OneApp Portfolio project.
Read these files to understand the current state and treat them as the ONLY source of truth:
- `Documentation/2-Architectural/System-Overview.md`
- `Documentation/2-Architectural/Backend-Architecture.md`
- `Documentation/4-Business-Requirements/` (Find the relevant feature spec)

If the requested change is not covered by these documents or they appear inconsistent with the repository structure, you MUST pause and request that the documentation be updated before proceeding.

## 2. User Input
Please provide:
1. **Feature to Update**: Which existing module?
2. **Change Request**: What needs to change? (Logic, UI, Data)
3. **Reason**: Why is this change needed?
4. **Scope Boundaries**: What must NOT be changed as part of this request.

## 3. Execution Rules
1. **Impact Analysis**: Use the Business Requirements and architecture docs to identify dependent modules and routes.
2. **Backward Compatibility**: Do NOT change data schemas or documented behavior without updating the corresponding docs and calling that out explicitly.
3. **Documentation Sync**: Update the relevant feature file in `Documentation/4-Business-Requirements/` and adjust architectural docs if the design changes.
4. **No Undocumented Changes**: Do NOT modify parts of the system that are not mentioned in the change request or documentation.
5. **Clarifying Questions**: Ask questions if the requested change conflicts with existing documented behavior.

## 4. Expected Output
1. **Impact Report**: Files and features affected.
2. **Refactoring Plan**: Steps to apply the change safely.
3. **Code Changes**: Diff or code blocks.
4. **Verification**: How to ensure no regressions.

