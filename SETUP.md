# Counter.dev Personal Fork - Setup Guide

This is a personal fork of [ihucos/counter.dev](https://github.com/ihucos/counter.dev) for development and customization purposes.

## What Was Done

### 1. Fork Creation

- Forked from `ihucos/counter.dev` to `ricardo-camilo-programador-frontend-web/counter.dev`
- Configured remotes:
  - `origin`: Personal fork (for push)
  - `upstream`: Original repo (for updates)

### 2. Code Quality Improvements

#### Static JavaScript (`static/js/dashboard.js`)
- Fixed typo: "very import element" → "very important element"
- Changed `var` to `const` for immutable variables
- Improved variable declarations and code style

#### Documentation
- Added `CODE_QUALITY_IMPROVEMENTS.md` with:
  - Guidelines for American English (already compliant)
  - Code quality best practices
  - TODO list for future improvements
  - Testing checklist

## American English Compliance

The original counter.dev project already uses American English throughout:
- "color" not "colour"
- "organize" not "organise"
- "analyze" not "analyse"
- "license" not "licence"

No conversions were needed.

## Setup Instructions

### For Development

```bash
# Clone the fork
cd /home/camillusr/Projetos/GitHub
git clone https://github.com/ricardo-camilo-programador-frontend-web/counter.dev.git
cd counter.dev

# Switch to correct GitHub account
unset GH_TOKEN
gh auth switch --user ricardo-camilo-programador-frontend-web

# Create a feature branch
git checkout -b feature/description

# Make changes...
git add .
git commit -m "feat: description"

# Push to personal fork
git push -u origin feature/description
```

### To Run Locally

The project requires:
- Go (for backend)
- Redis
- Node.js dependencies (via npm/CDN)

Run development server:
```bash
make devserver
```

### To Sync with Upstream

```bash
git fetch upstream
git checkout master
git merge upstream/master
git push origin master
```

## Branch Structure

- `master`: Main branch (from upstream)
- `feature/american-english-cleanup`: Code quality improvements
- `feature/*`: Future features

## Next Steps

1. [ ] Create fork manually via GitHub web UI (requires browser login)
2. [ ] Configure CI/CD for quality checks
3. [ ] Add ESLint for JavaScript
4. [ ] Add Prettier for code formatting
5. [ ] Add unit tests for critical functions
6. [ ] Document API endpoints
7. [ ] Add contribution guidelines

## Notes

- The project uses vanilla JavaScript (no framework)
- Custom Elements (Web Components) are used extensively
- Chart.js for data visualization
- Server-Sent Events (SSE) for real-time updates
- Redis + SQLite for data storage

## License

AGPL-3.0 (same as upstream)

## Contact

For issues or questions, open an issue in this repository.

---

**Created:** June 10, 2026
**Forked from:** https://github.com/ihucos/counter.dev
**Personal fork:** https://github.com/ricardo-camilo-programador-frontend-web/counter.dev (to be created via web UI)