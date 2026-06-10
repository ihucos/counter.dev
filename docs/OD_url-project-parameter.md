# Open Design: URL Project Parameter Feature

## Problem Statement

When users have multiple projects (websites) tracked by counter.dev and switch between them using the dropdown selector, the dashboard often fails to load the correct data for the selected project. The root cause is a lack of synchronization between the URL state and the internal dashboard state.

## Current Behavior

- Dashboard loads all projects via SSE (`/dump`)
- First project in list (by visit count) is displayed, not the one user intended
- When switching projects via `<select>`:
  - Frontend calls `/setPrefSite?site=x`
  - Backend updates Redis preference
  - Frontend reuses cached dump with different `selector.site`
  - Graphs/components display WRONG data (from previous site)
- No URL state: refreshing page loses selected project

## Proposed Solution

Add `?projeto=x` (American English: `?project=x`) parameter to URL with hybrid approach:

### Backend Changes (`/dump` endpoint)

1. Accept `project` query parameter
2. If `project` present:
   - Return dump with ONLY that project's data
   - Ignore `prefs.site` from Redis
3. If `project` absent:
   - Use `prefs.site` (current behavior)
4. If `project` doesn't exist:
   - Return 404 or redirect to first project

### Frontend Changes (`selector.js`)

1. Read `project` parameter on load:
   ```javascript
   const urlParams = new URL(window.location).searchParams;
   const projectFromUrl = urlParams.get('project');
   if (projectFromUrl) {
     this.site = projectFromUrl;
   }
   ```

2. Update URL when switching projects:
   ```javascript
   onSiteSelChanged(evt) {
     this.updateFavicon();
     fetch("/setPrefSite?" + encodeURIComponent(this.site));
     this.dump.user.prefs.site = this.site;

     // Update URL
     const newUrl = new URL(window.location);
     newUrl.searchParams.set('project', this.site);
     window.history.pushState({site: this.site}, '', newUrl);

     document.dispatchEvent(new CustomEvent("redraw", { detail: this.dump }));
   }
   ```

3. Handle browser back/forward:
   ```javascript
   window.addEventListener('popstate', (evt) => {
     if (evt.state && evt.state.site) {
       this.site = evt.state.site;
       // Trigger redraw with correct site
     }
   });
   ```

### Files to Modify

**Backend (Go):**
- `backend/endpoints/dump.go`
  - Add `project` parameter extraction
  - Filter `sites` in dump based on project
  - Handle 404 for non-existent project

**Frontend (JavaScript):**
- `static/components/dashboard/selector.js`
  - Read URL parameter on load
  - Update URL on selection change
  - Handle `popstate` events

**Documentation:**
- Update `SETUP.md` with new URL parameter usage
- Add examples in `CODE_QUALITY_IMPROVEMENTS.md`

## Benefits

✅ Solve data loading bug when switching projects
✅ Enable deep linking to specific projects
✅ Allow bookmarking project views
✅ Improve cross-device consistency (same URL = same view)
✅ Maintain backward compatibility (URL param optional)
✅ Enable sharing of project dashboards

## Trade-offs

| Aspect | Impact |
|--------|--------|
| State duplication | URL + Redis prefs both represent same concept (mitigated by URL priority) |
| Backend complexity | Minimal (one parameter to read and filter) |
| Breaking changes | None (URL param optional, existing flows unchanged) |
| Testing required | Multi-project scenario, browser back/forward, direct URL access |

## Success Criteria

- [ ] User can access project via `?project=x` parameter
- [ ] Switching projects updates URL
- [ ] Browser back/forward navigates project history
- [ ] Refreshing page preserves selected project
- [ ] Invalid `project` parameter handled gracefully
- [ ] Sessionless access works with URL parameter
- [ ] No regression in existing functionality

## Implementation Notes

- Use American English: `project` (not `projeto`)
- Maintain existing Redis preference as fallback
- Throttle URL updates (debounce to avoid history spam)
- Consider accessibility (URL changes announced to screen readers)

## Related Issues

- Original issue: Data loading bug with project switching
- Enhancement: Better URL state management
- UX improvement: Deep linking and bookmarkability

---

**Author:** Ricardo Camilo
**Created:** June 10, 2026
**Status:** ✅ Implemented - Awaiting Merge
**Commits:** 79c2613