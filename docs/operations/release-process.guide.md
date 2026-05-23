---
title: Release process — beacon-docs
updated: 2026-05-22
---

# Release process — beacon-docs

## When to use

After merging one or more feature branches or bug fixes to `main` and verifying that:
- All tests pass: `npm test` exits 0 with 147 (or more) passing.
- The build is clean: `npm run build` produces `dist/cli.js` without errors.
- `beacon lint` exits 0 on the repo's own docs.
- The changes are documented in a `.changeset/*.md` file (created via `npx changeset`).

Do not release from a branch. Always release from `main`.

## Steps

### 1. Consume the changeset and bump the version

```bash
npx changeset version
```

This reads all pending `.changeset/*.md` files, bumps the version in `package.json` following
SemVer (patch / minor / major based on changeset type), and updates `CHANGELOG.md`.

### 2. Review the changelog

Open `CHANGELOG.md` and confirm the entry accurately describes what changed. Edit for clarity
if needed — the changelog is user-facing.

### 3. Run a final test + build

```bash
npm test && npm run build
```

Both must succeed before proceeding.

### 4. Commit the version bump

```bash
git add package.json CHANGELOG.md
git commit -m "chore: release vX.Y.Z"
```

Do not include the `.changeset/` files in this commit — `changeset version` deletes them
automatically.

### 5. Tag the release

```bash
git tag vX.Y.Z
```

Replace `X.Y.Z` with the version number from `package.json`.

### 6. Publish to npm

```bash
npm publish --access public
```

`prepublishOnly` in `package.json` runs `npm run build` before publishing. The `files` field
in `package.json` ensures only `dist/`, `README.md`, and `LICENSE` are included in the tarball.

### 7. Push to remote

```bash
git push origin main --tags
```

Push both the commit and the tag. The `--tags` flag is required to push the release tag.

### 8. Create a GitHub Release

On GitHub, navigate to **Releases → Draft a new release**. Select the tag `vX.Y.Z`. Use the
CHANGELOG entry as the release description. Attach no binaries for V1 (npm-only distribution).

## Troubleshooting

**npm publish fails with 403 Forbidden:**
You are not logged in or your npm token has expired. Run `npm login` and retry. If publishing
from CI, check that the `NPM_TOKEN` secret is set and has publish scope.

**Dirty working tree error:**
Running `npm publish` with uncommitted changes fails the `prepublishOnly` build check. Commit
or stash all changes before publishing.

**Version conflict — version already exists on npm:**
You cannot publish the same version twice. If the version was published in error, deprecate it
(`npm deprecate beacon-docs@X.Y.Z "reason"`), bump to a patch version, and republish.

**The tag already exists locally:**
If a previous release attempt created the tag before failing, delete it locally
(`git tag -d vX.Y.Z`) and re-create it after resolving the issue.

**`changeset version` finds no changesets:**
Either all changesets were already consumed, or the feature was not accompanied by a changeset.
To add a changeset retroactively: `npx changeset add`, choose the change type, write the
summary, and commit the new `.changeset/*.md` file before running `changeset version` again.
