---
title: Adding a new category to Beacon
created: 2026-05-22
---

# Adding a new category to Beacon

## Problem

You need to add a new documentation category to Beacon — either a new core category (always
present in all projects) or a new add-on category (opt-in via wizard or `beacon enable`).

## Solution

Categories are defined in several coordinated locations. Touch each in order:

### 1. Register the category in `src/core/project-types.ts`

Add the new category name to `CORE_CATEGORIES` or `ADDON_CATEGORIES`:

```typescript
// For a core category (always present):
export const CORE_CATEGORIES = [
  "reference", "architecture", "adr", "plans", "backlog", "evaluations",
  "your-new-category",   // add here
] as const;

// For an add-on category (opt-in):
export const ADDON_CATEGORIES = [
  "compliance", "business", "modules", "integrations", "operations", "roadmaps",
  "your-new-category",   // add here
] as const;
```

If it's a core category, also add it to every project type's default array in `DEFAULTS_BY_TYPE`.
If it's an add-on, add it only to the project types where it should be pre-selected by default.

### 2. Add metadata in `src/core/categories.ts`

Add an entry to `CATEGORY_META`:

```typescript
"your-new-category": {
  category: "your-new-category",
  location: "your-new-category",       // folder name under docs/
  suffix: ".yourtype.md",              // filename suffix for this category
  archivable: false,                   // true if docs can be moved to _archive/
  datePrefix: false,                   // true if docs require YYYY-MM-DD- prefix
},
```

### 3. Add AI rule content in `src/generators/ai-rules.ts`

Add a project-specific rule entry to `PROJECT_SPECIFIC_RULES`:

```typescript
const PROJECT_SPECIFIC_RULES: Record<string, string> = {
  // ... existing entries ...
  "your-new-category": "- **`your-new-category/*.yourtype.md`** — describe what goes here.",
};
```

Add a decision table row to `DECISION_ROWS`:

```typescript
const DECISION_ROWS: Record<string, string> = {
  // ... existing entries ...
  "your-new-category": '| "Where does X go for my new category?" | `your-new-category/` |',
};
```

### 4. Add a frontmatter template in `src/templates/frontmatter/`

Create `src/templates/frontmatter/yourtype.md.ejs` based on an existing template (e.g., `plan.md.ejs`):

```ejs
---
title: <%= slug %>
created: <%= date %>
---

# <%= slug %>

## Section 1

## Section 2
```

### 5. Add the type to `beacon new` dispatch in `src/commands/new.ts`

Find the `type` switch statement and add a case:

```typescript
case "yourtype":
  // handled automatically via categories.ts if suffix is registered
  break;
```

### 6. Add a README template (optional but recommended)

In `src/templates/`, add or update the category README template so new projects get a useful
README when `beacon init` or `beacon enable your-new-category` creates the folder.

### 7. Run tests

The test suite includes `project-types.test.ts` and `categories.test.ts` which assert on the
full list of categories. Update those tests to include your new category:

```bash
npm test
```

## Example

See how `operations` is implemented as an add-on: it appears in `ADDON_CATEGORIES`, has a
`DEFAULTS_BY_TYPE` entry for `cli-tool` and `web-app`, has a `CategoryMeta` entry with suffix
`.guide.md`, and has entries in both `PROJECT_SPECIFIC_RULES` and `DECISION_ROWS`.
