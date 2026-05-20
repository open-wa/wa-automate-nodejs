# QoL and Parity Docs Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Recreate Quality-of-Life and visual styling features from the legacy documentation in the new docs app, including double-bracket entity link resolution, a top-level flat Client reference page, a brand navigation header, and a licensing checkout Popover prefilling custom fields on Gumroad checkout redirect.

**Architecture:** Use a custom Remark plugin in `source.config.ts` to transform double-bracket syntaxes (`[[Entity]]`, `[[Entity.property]]`) and standard bracket links into resolved links via a generated `methods-map.json` and static mappings. Implement the licensing modal inline using a Radix Popover and tailwind styling. Adjust the base layout options inside `layout.shared.tsx` to align the top navigation bar perfectly.

**Tech Stack:** React, Radix Popover, Fumadocs UI, Tailwind CSS (v4), Remark, TypeScript.

---

### Task 1: Reference Generator Refactor & Flat Client Reference Page

**Files:**
- Modify: `packages/schema/scripts/gen-client-reference-docs.ts`
- Modify: `apps/docs/src/components/docs-mdx.tsx`
- Create: `apps/docs/content/docs/reference/client/client.mdx`
- Create: `apps/docs/content/docs/reference/client/methods-map.json`

**Step 1: Write flat reference generation logic and licensed indicators**
Modify `gen-client-reference-docs.ts` to:
- Collect all alphabetical methods from `clientRegistry.getAll()`.
- Generate `/apps/docs/content/docs/reference/client/client.mdx` displaying all client methods on a single page, including metadata blocks and parameters tables.
- Generate `/apps/docs/content/docs/reference/client/methods-map.json` mapping each `functionName` to `/docs/reference/client/<namespace>#<functionname>`.
- Add `client` to `meta.json` pages list under `/apps/docs/content/docs/reference/client/meta.json`.
- If `def.meta.license` is `'insiders'` or `'restricted'`, append the suffix ` - <license>` to the markdown header (e.g. `## \`getHostDevice\` - insiders`).
- If a method is licensed, append a blockquote `> license: <license> license` immediately below the description to trigger a beautiful `LicensedFeatureCallout`.

Modify `apps/docs/src/components/docs-mdx.tsx` to:
- Wrap `h2` headings using `createLicensedHeading` so that generated methods display a gorgeous badge directly next to their title.

**Step 2: Run reference generation**
Run: `node --import tsx packages/schema/scripts/gen-client-reference-docs.ts`
Expected output: Successful generation logs indicating the flat Client API docs were generated with 123 methods.

**Step 3: Commit reference generation changes**
```bash
git add packages/schema/scripts/gen-client-reference-docs.ts apps/docs/content/docs/reference/client/ apps/docs/src/components/docs-mdx.tsx
git commit -m "feat: generate flat client reference page, methods map json, and licensed feature indicators"
```

---

### Task 2: AST Auto-Linking with Custom Remark Plugin

**Files:**
- Modify: `apps/docs/source.config.ts`
- Create: `apps/docs/scripts/test-remark-plugin.ts`

**Step 1: Write Remark plugin code**
Implement `remarkBracketLinks` inside `apps/docs/source.config.ts` to:
- Parse and rewrite double-bracket patterns `[[something]]` and `[[`something`]]` in `text` and `inlineCode` nodes.
- Walk the AST and split text nodes to insert a child `link` node with correct URLs matching `methods-map.json` and key types (e.g. `ConfigObject.sessionId`, `Message`, `SimpleListener`).

**Step 2: Write Remark test script**
Create `apps/docs/scripts/test-remark-plugin.ts` to run Remark parser against standard mock strings:
```typescript
import { remarkBracketLinks } from '../source.config';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';

const processor = unified().use(remarkParse).use(remarkBracketLinks).use(remarkStringify);
const input = 'Represents [[onAck]] and [[ConfigObject.sessionId]].';
const output = processor.processSync(input).toString();
console.log('Result:', output);
if (output.includes('(/docs/reference/client/messages#onack)') && output.includes('(/docs/guides/config-schema#sessionid)')) {
  console.log('PASS');
} else {
  console.log('FAIL');
  process.exit(1);
}
```

**Step 3: Run the Remark plugin test**
Run: `node --import tsx apps/docs/scripts/test-remark-plugin.ts`
Expected output: `PASS`

**Step 4: Commit Remark plugin changes**
```bash
git add apps/docs/source.config.ts apps/docs/scripts/test-remark-plugin.ts
git commit -m "feat: implement remarkBracketLinks plugin for automatic entity linking"
```

---

### Task 3: Interactive Licensing checkout popover

**Files:**
- Modify: `apps/docs/src/components/licensing.tsx`

**Step 1: Write Popover component with checkout form**
Use Radix Popover components from `apps/docs/src/components/ui/popover.tsx` to wrap `GetLicenseButton` in a popup.
Capture input fields:
- Github Username
- Number (e.g 447712345678)
- Reason/Use case
Upon clicking "Proceed", construct URL prefilled with exact fields (e.g. `?Github%20Username=...&Number%20%28e.g%20447712345678%29=...&Reason%2FUse%20case=...`) and perform redirect.

**Step 2: Commit popover integration**
```bash
git add apps/docs/src/components/licensing.tsx
git commit -m "feat: implement interactive licensing popover with dynamic gumroad query prefill"
```

---

### Task 4: Layout Header Restructuring & styling

**Files:**
- Modify: `apps/docs/src/lib/layout.shared.tsx`
- Modify: `apps/docs/src/styles/app.css`

**Step 1: Restructure Navigation and Brand Logo**
Copy logo assets:
```bash
cp docs-legacy/static/img/logo.png apps/docs/public/logo.png
```
Modify `layout.shared.tsx`:
- Render logo next to title.
- Setup "Get Started" and "Community" dropdown layouts.
- Highlight "The Client API" pointing to `/docs/reference/client/client`.

**Step 2: Add green/emerald styling and button overlays**
Inside `app.css`, write rules targeting:
- `nav a[href*="/reference/client/client"]` to color link as emerald-500.
- Make the trigger button look sleek, professional black button.

**Step 3: Verify the whole workspace builds**
Run: `pnpm --filter docs check`
Expected output: Successful typechecking with no errors.

**Step 4: Commit layout and styling changes**
```bash
git add apps/docs/src/lib/layout.shared.tsx apps/docs/src/styles/app.css apps/docs/public/logo.png
git commit -m "feat: adjust header navigation layout, brand logo, and custom green/black styling"
```
