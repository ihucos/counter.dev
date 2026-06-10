# SDD Workflow for Counter.dev

This document defines how to apply Spec-Driven Development (SDD) to the counter.dev project.

## 1. Issue Identified

When implementing the URL parameter feature (?project=x), the SDD workflow was NOT followed correctly:
- ❌ Issue not created first in the original repository
- ❌ SDD not created before implementation
- ❌ Went directly to implementation → PR
- ✅ Code review was performed (MOA — 3 providers)

## 2. Correct SDD Workflow

### Step 1: Create Issue (in ORIGINAL repository)

**Repository:** `ihucos/counter.dev` (NOT the fork)

**Issue format (project pattern):**
```
Title: [Type] Brief description

Body:
## Problem
[Detailed problem description]

## Proposed Solution
[Proposed solution]

## Benefits
[List of benefits]

## Acceptance Criteria
[Acceptance criteria checklist]
```

**Issue types:**
- `[Feature]` — New feature
- `[Bug]` — Bug fix
- `[Improvement]` — Existing improvement

**Command:**
```bash
gh issue create --repo ihucos/counter.dev \
  --title "[Feature] URL parameter for deep linking" \
  --body "$(cat issue-template.md)"
```

**Example:** Issue #141 — https://github.com/ihucos/counter.dev/issues/141

---

### Step 2: Create SDD (in FORK)

**Repository:** `ricardo-camilo-programador-frontend-web/counter.dev-true-immortal`

**Path:** `docs/SDD_<feature_name>.md`

**SDD Template:**
```markdown
# SDD: <Feature Name>

**Created:** MM/DD/YYYY
**Status:** <Status>
**PR:** <PR Number>
**Issue:** <Issue Number in original repository>

---

## 1. Problem Statement

[Problem description with examples]

### Current Behavior

[Detailed current behavior]

### Example User Journey

[User journey]

---

## 2. Proposed Solution

[Technical solution description]

### Backend Changes

[Backend files changed]

### Frontend Changes

[Frontend files changed]

---

## 3. Benefits

[List of benefits]

---

## 4. Implementation Plan

### Phase 1: Backend
- [ ] Task 1
- [ ] Task 2

### Phase 2: Frontend
- [ ] Task 1
- [ ] Task 2

### Phase 3: Testing
- [ ] Test 1
- [ ] Test 2

---

## 5. Acceptance Criteria

[Acceptance criteria checklist]

---

## 6. Code Review Status

[Review link, status, issues found]

---

## 7. Related

[Links to issue, PR, fork, branch, commits]

---

## 8. Lessons Learned

[Lesson learned during the process]

---

## 9. Next Steps

[Next steps]

---

**Author:** Ricardo Camilo
**Last Updated:** MM/DD/YYYY
```

**Command:**
```bash
# Create SDD
vim docs/SDD_url-project-parameter.md

# Commit
git add docs/SDD_url-project-parameter.md
git commit -m ":memo: docs(SDD): add Spec-Driven Development document for ..."

# Push
git push
```

**Example:** `docs/SDD_url-project-parameter.md`

---

### Step 3: Implementation

**Branch naming:**
```bash
git checkout -b feature/<feature_name>
```

**Commit format (project pattern):**
```bash
git commit -m ":emoji: type(scope): description"
```

**Available emojis:**
- `:sparkles:` — New feature
- `:bug:` — Bug fix
- `:memo:` — Documentation
- `:refactor:` — Refactoring
- `:test:` — Tests

**Types:**
- `feat` — Feature
- `fix` — Fix
- `docs` — Documentation
- `refactor` — Refactoring
- `test` — Tests

**Scope:**
- `url` — URL routing
- `backend` — Backend
- `frontend` — Frontend
- `auth` — Authentication
- `dashboard` — Dashboard

**Example:**
```bash
git commit -m ":sparkles: feat(url): add ?project=x parameter for deep linking"
```

---

### Step 4: Create PR

**Command:**
```bash
gh pr create --base master \
  --title "feat(url): add project parameter for deep linking to specific sites" \
  --body "Closes #141"
```

**Important:** Add `Closes #<issue-number>` in PR body to auto-link.

---

### Step 5: Code Review (MOA)

**For code reviews:**
- Use 3 different providers
- Create reviews in parallel
- Consolidate findings
- Post as PR comment

**See skill:** `software-development/requesting-code-review`

---

### Step 6: Link Issue and PR

**Via issue comment:**
```bash
gh issue comment <issue-number> --repo ihucos/counter.dev \
  --body "## Implementation

Implemented in PR #<pr-number>

**Changes:**
- Backend: \`project\` parameter handling
- Frontend: URL sync and history management

**Status:** Code review in progress

See PR: https://github.com/ihucos/counter.dev/pull/<pr-number>"
```

**Via PR body:**
```markdown
## Related

Closes #<issue-number>
```

---

### Step 7: Fix Code Review Issues

**Rules:**
- One commit per fix
- Descriptive commits
- Test after each fix
- Re-request review

**Example:**
```bash
# Fix syntax error
patch --path static/components/dashboard/selector.js --old-string "var" --new-string "const"
git add static/components/dashboard/selector.js
git commit -m ":bug: fix(selector): correct syntax errors"
git push

# Fix validation
patch --path backend/endpoints/dump.go --old-string "..." --new-string "..."
git add backend/endpoints/dump.go
git commit -m ":bug: fix(dump): add input validation for project parameter"
git push
```

---

### Step 8: Re-review

- Rerun code review after fixes
- Post updated status
- Close old review if all issues resolved

---

### Step 9: Merge

**Rules:**
- Code review approved (zero CRITICAL/MAJOR)
- All tests pass
- Issue marked as "in progress" or "closed"

**Command:**
```bash
# Merge via CLI
gh pr merge <pr-number> --squash

# Or via GitHub web interface
```

---

### Step 10: Update Issue

```bash
gh issue close <issue-number> --repo ihucos/counter.dev \
  --comment "Closed via PR #<pr-number> ✅

All acceptance criteria met:
- [x] URL parameter working
- [x] Deep linking working
- [x] Browser back/forward working
- [x] No regressions"
```

---

## 3. Repositories Involved

| Repository | Purpose | Issues | PRs |
|------------|---------|--------|-----|
| `ihucos/counter.dev` | Original/upstream | ✅ Create issues here | ❌ Do NOT create PRs here (work fork) |
| `ricardo-camilo-programador-frontend-web/counter.dev-true-immortal` | Work fork | ❌ Issues disabled | ✅ Create PRs here |

---

## 4. Complete Example

**Workflow for URL parameter feature:**

```bash
# 1. Create issue in original repo
gh issue create --repo ihucos/counter.dev \
  --title "[Feature] URL parameter for deep linking to specific sites" \
  --body "..." # Issue #141

# 2. Create SDD in fork
vim docs/SDD_url-project-parameter.md
git add docs/SDD_url-project-parameter.md
git commit -m ":memo: docs(SDD): add Spec-Driven Development document"
git push

# 3. Implement feature
git checkout -b feature/url-project-parameter
# Make changes...
git add .
git commit -m ":sparkles: feat(url): add ?project=x parameter for deep linking"
git push

# 4. Create PR
gh pr create --base master \
  --title "feat(url): add project parameter for deep linking to specific sites" \
  --body "Closes #141"

# 5. Code review (MOA)
# See skill: software-development/requesting-code-review

# 6. Link issue and PR
gh issue comment 141 --repo ihucos/counter.dev \
  --body "Implemented in PR #140"

# 7. Fix code review issues
# One commit per fix...

# 8. Re-review

# 9. Merge
gh pr merge 140 --squash

# 10. Update issue
gh issue close 141 --repo ihucos/counter.dev \
  --comment "Closed via PR #140 ✅"
```

---

## 5. Lessons Learned

**Error committed:**
- ❌ Implemented without creating issue first
- ❌ Did not create SDD before implementation
- ❌ Created PR without issue linked

**Correction applied:**
- ✅ Created issue #141 in original repo
- ✅ Created SDD in fork
- ✅ Linked issue and PR via comments
- ✅ Documented SDD workflow

---

## 6. Important Rules

1. **ALWAYS create issue first** — in original repository
2. **ALWAYS create SDD before implementation** — in fork
3. **ALWAYS link issue and PR** — via PR body or comment
4. **ONE commit per fix** — do not bundle fixes
5. **Code review required** — MOA with 3 providers
6. **Commit format** — follow project pattern with emojis
7. **Branch naming** — use `feature/` prefix
8. **ALL GitHub content in American English** — issues, PRs, commits, docs

---

**Author:** Ricardo Camilo
**Created:** June 10, 2026
**Last Updated:** June 10, 2026