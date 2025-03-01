# Version Update Guide

This document provides a guide on where version numbers need to be updated when releasing a new version of PowerPulse.

## Files to Update

When updating the version of PowerPulse, the following files need to be updated:

1. **Root package.json**
   - Location: `/package.json`
   - Update the `"version"` field

2. **Client package.json**
   - Location: `/client/package.json`
   - Update the `"version"` field

3. **Server package.json**
   - Location: `/server/package.json`
   - Update the `"version"` field

4. **README.md**
   - Location: `/README.md`
   - Update the version badge: `![Version](https://img.shields.io/badge/version-X.Y.Z-green)`

## Automatic Version Display

The web UI automatically reads the version from the client's package.json file through the following mechanism:

1. `client/src/config/appConfig.js` imports the version from `client/package.json`
2. Components like `ApplicationInfo.jsx` and `Footer.jsx` read the version from `appConfig.js`

This means that once you update the version in `client/package.json`, the web UI will automatically display the new version.

## Tests

The test file `client/src/test/example.test.jsx` has been updated to dynamically read the version from `client/package.json` rather than using a hardcoded version number. This ensures that the test will continue to pass when the version is updated.

## CHANGELOG.md

Don't forget to update the CHANGELOG.md file with details about the new version, following the existing format:

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes

### Removed
- Removed features
```

## GitHub Release Process

After updating all version numbers and the CHANGELOG.md, commit the changes and push to the appropriate branch (e.g., `release/vX.Y.Z`). Then create a new release on GitHub with the appropriate tag.
