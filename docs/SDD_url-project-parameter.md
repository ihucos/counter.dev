# SDD: URL Project Parameter Feature

**Created:** June 10, 2026
**Status:** Implementation Complete — Code Review In Progress
**PR:** #140
**Issue:** #141 (upstream counter.dev repo)

---

## 1. Problem Statement

When users have multiple projects (websites) tracked by counter.dev and switch between them using the dropdown selector, the dashboard often fails to load the correct data for the selected project. The root cause is a lack of synchronization between the URL state and the internal dashboard state.

### Current Behavior

- Dashboard loads all projects via SSE (`/dump`)
- First project in list (by visit count) is displayed, not the one user intended
- When switching projects via `<select>`:
  - Frontend calls `/setPrefSite?site=x`
  - Backend updates Redis preference
  - Frontend reuses cached dump with different `selector.site`
  - Graphs/components display WRONG data (from previous site)
- No URL state: refreshing page loses selected project

### Example User Journey

User has 3 sites: `a.com`, `b.com`, `c.com`

1. Opens dashboard → sees `a.com` (first by count)
2. Switches to `b.com` in dropdown
3. **BUG:** Graphs still show data from `a.com`
4. Refreshes page → back to `a.com` (no state persistence)

---

## 2. Proposed Solution

Add `?project=x` parameter to dashboard URL with hybrid approach:

### Backend Changes (`/dump` endpoint)

1. Accept `project` query parameter
2. If `project` present:
   - Add to `dump.meta` for frontend consumption
3. If `project` absent:
   - Use `prefs.site` (current behavior)

**Lines Changed:** 7 lines in `backend/endpoints/dump.go`

### Frontend Changes (`selector.js`)

1. Read `project` parameter on load:
   ```javascript
   const urlParams = new URL(window.location).searchParams;
   this.projectFromUrl = urlParams.get("project");
   ```

2. Use `meta.project` for initial site selection:
   ```javascript
   let sitePref = dump.meta.project || dump.user.prefs.site;
   ```

3. Update URL when switching projects:
   ```javascript
   onSiteSelChanged(evt) {
     const newUrl = new URL(window.location);
     newUrl.searchParams.set("project", this.site);
     window.history.pushState({site: this.site}, "", newUrl);
   }
   ```

4. Handle browser back/forward:
   ```javascript
   window.addEventListener("popstate", (evt) => {
     if (evt.state && evt.state.site) {
       select.value = evt.state.site;
       this.onSiteSelChanged();
     }
   });
   ```

**Lines Changed:** ~24 lines in `static/components/dashboard/selector.js`

---

## 3. Benefits

- ✅ Solve data loading bug when switching projects
- ✅ Enable deep linking to specific projects
- ✅ Allow bookmarking project views
- ✅ Improve cross-device consistency (same URL = same view)
- ✅ Maintain backward compatibility (URL param optional)
- ✅ Enable sharing of project dashboards
- ✅ Browser back/forward navigation works

---

## 4. Example URLs

```
/dashboard.html?user=CamillusBloodfallen&token=Q5ysSKM8YJI%3D&project=example.com
/dashboard.html?project=myportfolio.com
/dashboard.html?user=username&token=abc123&project=blog.example.com
```

---

## 5. Implementation Plan

### Phase 1: Backend
- [x] Read `project` parameter from `ctx.R.FormValue("project")`
- [x] Add to `meta` map if not empty
- [x] Test with `curl` to verify meta inclusion

### Phase 2: Frontend
- [x] Read URL parameter in constructor
- [x] Use `meta.project` in `draw()` with fallback
- [x] Update URL in `onSiteSelChanged()`
- [x] Add `popstate` listener
- [ ] Test all user journeys

### Phase 3: Documentation
- [x] Update Open Design document
- [x] Create SDD (this document)
- [ ] Update README with new URL parameter usage
- [ ] Add examples to help pages

### Phase 4: Testing
- [ ] Manual testing with multi-project accounts
- [ ] Test sessionless access (token-based)
- [ ] Test browser back/forward
- [ ] Test deep linking
- [ ] Test bookmarking
- [ ] Regression testing of existing flows

---

## 6. Acceptance Criteria

- [ ] URL parameter `?project=x` is read on dashboard load
- [ ] Dropdown selects the correct project from URL
- [ ] Switching projects updates URL with new project
- [ ] Browser back/forward navigation works correctly
- [ ] Refreshing page maintains selected project (via URL)
- [ ] Sessionless access (token-based) works with URL parameter
- [ ] No regression in existing flows
- [ ] No syntax errors (see code review)
- [ ] Input validation on backend
- [ ] No circular history mutation in popstate

---

## 7. Code Review Status

**Review Posted:** https://github.com/ihucos/counter.dev/pull/140#issuecomment-4673837409

**Verdict:** ❌ BLOCKING — CRITICAL + MAJOR issues found

**Issues to Fix:**
- CRITICAL: Backend validation missing (state injection risk)
- CRITICAL: Syntax errors in frontend (will crash at runtime)
- MAJOR: Circular history mutation in popstate handler
- MAJOR: Unused variable `this.projectFromUrl`
- MAJOR: Event handler signature mismatch
- MAJOR: Go style issues (fails gofmt)
- MINOR: Let vs const inconsistency
- SUGGESTION: Debounce pushState calls

**Status:** Awaiting fixes before merge

---

## 8. Related

- **Issue:** https://github.com/ihucos/counter.dev/issues/141
- **PR:** https://github.com/ihucos/counter.dev/pull/140
- **Fork:** https://github.com/ricardo-camilo-programador-frontend-web/counter.dev-true-immortal
- **Branch:** `feature/url-project-parameter`
- **Commits:** 79c2613, f6a6edf

---

## 9. Lessons Learned

1. **Always create issue first** — Following SDD means starting with Issue → SDD → Implementation → Review → Merge
2. **Project patterns matter** — counter.dev uses simple issue format, not SGS_WEB's complex templates
3. **Branch naming** — Use `feature/` prefix for new features
4. **Code quality** — Even simple changes need thorough review (found 8+ issues in 31 lines)
5. **Testing** — Manual testing is essential before code review

---

## 10. Next Steps

1. Fix CRITICAL and MAJOR issues from code review
2. Add input validation in backend
3. Fix syntax errors in frontend
4. Fix circular popstate bug
5. Remove unused variable or wire it correctly
6. Run gofmt on backend
7. Test all acceptance criteria
8. Request re-review
9. Merge after review approval
10. Update upstream issue status

---

**Author:** Ricardo Camilo
**Last Updated:** June 10, 2026