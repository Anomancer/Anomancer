# Lighthouse UI Constitution R1

Lighthouse uses one application shell and one component grammar. A new view is composed from the same primitives instead of inventing a local navigation system, card language, spacing scale or status pattern.

## 1. Shell

Every authenticated Lighthouse view uses the same shell:

- left: Lighthouse mark and wordmark
- right: `Valikko`
- center: only the active work surface
- global navigation, mode switching and secondary destinations live in `Valikko`
- contextual controls may appear inside the active surface, never as a second global navigation bar

The canonical authenticated route is `/lighthouse/workbench`. View state is encoded with `?view=` and the current workspace with `?workspace=`.

## 2. Spatial law

Canonical values are owned by `lighthouse-ui-constitution.css`.

- header height: `--lhc-header-height`
- content max width: `--lhc-content-width`
- panel radius: `--lhc-radius`
- control height: `--lhc-control-height`
- outer page spacing follows one scale
- machine-room views may increase information density but must keep the same outer frame

No workspace may define its own application header height, global page width or global navigation pattern.

## 3. Page header

A top-level surface uses one header pattern:

1. optional eyebrow / kicker
2. one page title
3. one short description
4. optional primary action on the right

Long explanations belong below the header or behind contextual disclosure.

## 4. Panel

`Panel` is the default container for grouped information.

- one border weight
- one corner radius
- no decorative gradient unless it communicates state
- shadow is normally absent
- accent is reserved for primary action, selected state or meaningful status

Nested panels should be avoided. Prefer spacing and dividers inside one panel.

## 5. List

Lists use a single row grammar:

- primary label first
- secondary metadata muted
- status has a dedicated status treatment
- date or secondary value follows
- row action is contextual

A table-like list may become denser in Ajot or Konehuone, but typography and status semantics remain the same.

## 6. Form

Inputs, selects, textareas, toggles and sliders share the same control height, radius, border and focus treatment. Labels are quiet. Help text is secondary. Destructive actions never borrow the primary accent.

## 7. Status

Semantic states are global:

- `success`: completed, healthy, published, ready
- `warning`: draft, degraded, needs attention
- `error`: failed, blocked, broken
- `neutral`: informational or inactive

Color is never the only carrier of meaning. Text remains explicit.

## 8. Empty state

An empty state contains:

1. short title
2. one sentence explaining why the surface is empty
3. at most one obvious next action when an action exists

Empty states do not introduce a new card style.

## 9. Menu

`Valikko` owns global navigation.

### Työ

- Työpöytä
- Nykyinen työ
- Mancerit
- Arkisto

### Konehuone

- Ajot
- Agentit
- Orkesterit
- Konehuone

### Julkaisu

- Julkaisut
- Lähetykset

### Järjestelmä

- Asetukset
- Kevyt tila

## 10. Canonical top-level views

### Työpöytä

Overview only. Shows the current work, Mancer entry point, recent-run entry point and system state. It is not a second control plane.

### Mancerit

One calm grid/list of work worlds. Creation is the only primary action.

### Nykyinen työ

The editor or active task. Workspace-local tools are contextual. Sidebars and previews are not persistent chrome.

### Arkisto

Search, filters and results. Curator and provenance machinery stay secondary to the retrieval task.

### Ajot

Run list and run detail/timeline. Run Explorer is promoted from a nested machine-room accordion into its own top-level surface.

### Julkaisut

Publication list, status, date and actions. Opening an item transfers the user to Nykyinen työ.

### Asetukset

A real page, not a modal. Settings are grouped into visible sections and use the same form grammar as the rest of Lighthouse.

### Konehuone

The intentional technical surface. It may be denser and contain disclosures, registries and telemetry, while still using the same shell, page header, margins, panels, controls and state vocabulary.

## 11. Extension rule

A new Mancer or Lighthouse view must first map its needs to `Shell`, `Page header`, `Panel`, `List`, `Form`, `Status`, `Empty state` and `Menu`. A new UI primitive is added only when none of those can express the required interaction without harming clarity or accessibility.


## P0 amendment · wide shell and theme contract

The Constitution now treats visibility, width and theme as shell-level contracts:

- `[hidden]` wins over layout declarations. A non-active work surface must not leak into another route.
- Desktop work surfaces share a 1480 px maximum content frame with responsive inline margins.
- The Lighthouse brand mark is unboxed and visually primary in the global header.
- Dark and light themes are token-level states, selected in Settings and persisted per browser.
- Theme choice may alter color only. Spacing, hierarchy, status semantics and component geometry remain identical.

## P1 amendment · hierarchy and rhythm

P1 turns the Constitution from a shared shell into a shared page cadence:

- Every top-level Lighthouse surface uses the canonical `Page header` pattern, including Mancerit, Aineisto, Arkisto and Konehuone.
- The desktop page rhythm is owned by `--lhc-page-gap` and `--lhc-section-gap`; local views do not invent their own outer spacing scale.
- Työpöytä has one focal `Nykyinen työ` panel followed by exactly three equal next-step panels: Mancerit, Ajot and Julkaisut.
- Dashboard panels use solid surfaces. Accent is reserved for primary action, selection and meaningful state.
- Mancer cards inherit the same radius, padding rhythm and typography hierarchy as dashboard panels.
- List, filter and settings surfaces use the same vertical cadence even when their internal information density differs.
- Responsive layouts may reflow the grid, but the hierarchy remains: current work first, next steps second, system state last.

## P2 amendment · state and absence grammar

P2 makes status and empty-state semantics identical across top-level work surfaces:

- `success`, `warning`, `error` and `neutral` are the only Lighthouse status states. The same state pill is used for publications, run outcomes, save readiness and top-level subsystem status.
- Status always includes explicit text. Color and the status dot reinforce meaning but never carry it alone.
- `Empty state` uses one structure: optional quiet icon, short title, one explanatory sentence and at most one contextual action.
- Mancerit, Ajot, Julkaisut and Arkisto use the canonical empty-state structure instead of local `core-empty`, `mancer-empty` or archive-specific variants for their primary result surface.
- Dark and light themes use the same semantic colors through Constitution tokens. Top-level Mancer, run and publication surfaces may not hard-code dark-only panel, row or metadata colors.
- A ready/tallennettu state is `success`; unsaved or attention-required work is `warning`; loading or running work is normally `neutral`; failed or broken state is `error`.


## P2.2 amendment · geometry and freeze budget

- The Lighthouse application shell is one column. Hiding a legacy sidebar must never leave a reserved grid column behind.
- A hidden contextual surface must never make the visible workspace inert. Dispatch discovery belongs to the canonical Publications surface.
- Settings are a single linear page. Legacy modal-era width controls may remain as compatibility state, but they are not primary UI.
- Heavy preview, Markdown, evidence and visualization rendering is demand-driven. When the preview is not visible and Evidence is not active, typing only updates cheap editor counters and dirty state.
- Optional preview is a context panel, not a permanent sibling of the editor.


## P2.4 amendment · resilient primary surfaces

The Lighthouse brand is a direct home affordance to Työpöytä. Editor geometry follows the same shell width as top-level pages. Light mode owns editor tabs and settings controls rather than inheriting dark modal chrome. Arkisto defaults to search and results only; inspector appears only for a selected object. Mancer loading exposes retry/error state and the server may serve the built-in workspace as a read-only fail-soft fallback when durable workspace state cannot be read. Private Blob reads use the authenticated pathname for the selected store credential.
