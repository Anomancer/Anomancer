# Changelog

## 1.25.0 UI Architecture Hardening
- Established canonical design tokens for shell geometry, safe areas, control heights, motion and z-index layers.
- Documented CSS ownership through the manifest and consolidated dead responsive overrides without changing computed layout.
- Reordered the Anomancer editor around the user workflow: title/content → save → evidence → metadata → review/publish → technical tools.
- Added semantic workflow landmarks while preserving existing IDs, persistence, authentication and publication behavior.
- Added an authenticated Workbench visual-baseline harness and a real-device evidence matrix.
- Kept real Safari verification explicitly open unless it is run on Apple hardware.
- Hardened browser-gate preflight to honor an explicit existing `CHROMIUM_BIN` before attempting any Playwright browser download.
- Fixed the installer so authenticated visual baselines survive installation and dev QA dependencies are installed deterministically with `npm ci --include=dev`.

## 1.24.6 UI/UX Audit Hardening
- Prevented long Lighthouse result headings from breaking inside ordinary words.
- Restored the 44 px minimum target for the Kevyt tila / Työpöytä selector.
- Replaced fragile emoji and full-width symbol controls with inline SVG icons.
- Made the desktop depth inspector intent-first: its empty panel no longer reserves a full column.
- Added a consent-gated handoff from a Light workspace to a new Anomancer draft in Workbench.
- Kept the Lighthouse brand visible in narrow Workbench headers and stopped mobile dock labels from truncating.
- Added a persistent mobile save/preview/publish strip above the dock.
- Kept Nanomancer preload status local instead of emitting a global success toast.
- Clarified connection, mode and orchestra terminology and strengthened disabled control states.

## 1.24.5 Workbench Visual Unification R2
- Removed the decorative icons from the Kevyt tila / Työpöytä selector.
- Reduced selector height further on desktop and mobile.
- Centered mode labels for a cleaner Lighthouse entry surface.

# Changelog

## 1.24.5 Lighthouse Workbench Visual Unification
- Brought the private Workbench into the same Lighthouse visual family as the `/lighthouse` entry surface.
- Added reusable Lighthouse workbench tokens for canvas, panels, borders, violet/pink accents, text, shadows and radii.
- Reworked shell chrome, workspace context, local navigation, operational cards, controls, dialogs, preview and drawers without changing workspace semantics.
- Replaced the generic shell diamond with the Lighthouse brand mark.
- Unified the mobile dock, sheets, preview and drawers in the canonical responsive owner.
- Kept destructive controls visibly distinct and left Mancer-specific semantic accents available.
- Bumped the Lighthouse PWA cache to 1.24.5.

# Changelog

## 1.24.4 Lighthouse Visual Identity R5
- Removed the Lighthouse subtitle line ("Anomancerin navigointikerros") from the entry surface.
- Removed the red spark divider below the logo.
- Reduced the height of the Kevyt tila / Työpöytä mode switch across desktop and mobile.
- Tightened Lighthouse hero spacing for a cleaner launch surface.

# 1.24.4 · Lighthouse Visual Identity

- Mockup-aligned Lighthouse entry surface using supplied brand assets.
- Anomancer hero removed from Lighthouse entry.
- Lighthouse logo, dock icons, favicon and PWA imagery added.
- Existing lightweight-mode work, trust, approval and runtime surfaces preserved.
- Release-version tests no longer pin the previous 1.24 patch release.

# 1.24.3 · Lighthouse stability

- Fixed Romancer ownership overlap: narrative workspaces are handled only by the narrative runtime, never simultaneously by the generic Mancer renderer.
- Added one bounded Workspace Store refresh + retry for revision/write CAS conflicts instead of surfacing a transient overlap error immediately.
- Rebuilt Konehuone into progressive-disclosure groups: Työtilat ja rajat, Agentit, Työkalut, Mallit, Orkesterit and Ajot are closed by default.
- Moved the mobile dispatch drawer below the persistent Lighthouse header so its own Lähetykset header is always reachable.
- Moved mobile Preview below both sticky header rows and above the thumb dock; the preview owns its own scroll region.
- Prevented modal/dialog scroll chaining into the page underneath and contained drawer/preview overscroll.
- Debounced the expensive Markdown/evidence/visualization preview rebuild while typing.
- Tightened desktop and mobile spacing without reducing tap targets or removing capabilities.
- Bumped the Lighthouse PWA cache generation to 1.24.3.

# 1.24.1 · Lighthouse Focus Layers

- Työ ensin, koneisto pyynnöstä.
- Desktop-esikatselu on opt-in.
- Päällekkäinen editoritabirivi piilotetaan desktopilla.
- Julkaisun metatiedot ovat oletuksena Julkaisun asetukset -kerroksessa.
- Orkesterin telemetria, ajoloki ja sopimusdetaljit ovat suljettuja oletuksena.
- Evidenssin viite-esitys ja visualisoinnit ovat toissijaisia disclosure-pintoja.
- Arkistonhoitaja ja Nanomancer avautuvat pyynnöstä.
- Mobiilin globaali shell kevenee ja paikallinen dokki on nelipaikkainen.
- Toiminnallisuutta ei poisteta.

# 1.24.0 · Lighthouse unification

- Promoted Lighthouse from an experimental Lab surface to the canonical private application shell.
- Added canonical `/lighthouse`, `/lighthouse/login` and `/lighthouse/workbench` surfaces; `/lab`, `/admin` and `/lahetyskone` remain compatibility aliases.
- Split the product interaction model into Light mode and Workbench over the same Core and authenticated session.
- Reframed Anomancer as the editorial/publishing Mancer and hid the legacy Toimituskone package from the user-facing Mancer registry.
- Added a visible taxonomy: Lighthouse → Mancer → Orchestra → Agent → Capability.
- Rebuilt Lighthouse chrome around a deep dark-purple system palette while preserving Mancer-local accents.
- Linked the public Anomancer and Core surfaces to Lighthouse sign-in and updated the public Core roadmap.
- Made Lighthouse available by default on Vercel preview/production while retaining remote authentication, CSRF and no-index boundaries.
- Defined Publishing Target as the future output adapter boundary so editorial work is not hardcoded to anomancer.com.
- Kept Vercel-direct release flow: local source → full release gate → `vercel --prod`; no GitHub dependency.

## 1.23.0 · R11 active filter count accessibility hotfix
- Fixed public mobile navigation double-toggle: Home/EN Home now use the shared `site.js` menu controller only; menu state, aria label and resize reset are centralized.
- Light-theme active audience/category filter count spans now use an explicit high-contrast text color.
- Prevents dark-theme `--dim` inheritance from failing axe contrast on `/lahetykset`.


## 1.23.0 · R9 Core light accessibility hotfix
- Increased light-theme contrast for model target code tokens in public Core.
- Scoped fix to `.core-model-targets span > code` for FI/EN desktop Core.
- Public theme switch: Home, Dispatches/articles and Core support a remembered light/dark theme; admin and Lighthouse remain unchanged.
- Vercel: korjattu public-funktioiden `includeFiles` Vercel CLI 59 -yhteensopiviksi string-globeiksi.
# 1.23.1 · Vercel Direct installer fix

- Root-anchors the generated `public/` exclusion so `api/public/` remains deployable.
- Updates the workspace installer contract test to enforce the corrected boundary.
- Keeps GitHub out of the runtime and deploy path.

# Changelog

## 1.23.0-vercel-direct.1

- Removed the external version-control deployment and persistence layer from the application.
- Production deployment is now direct Vercel CLI deployment after `npm run check`.
- Added a shared durable state backend: local filesystem in development, private Vercel Blob in production.
- Moved workspace, runtime, orchestra, run, archive and private artifact persistence to the shared state backend.
- Moved production editorial mutations and uploaded media to the Vercel content store while keeping local Markdown/media development intact.
- Added dynamic public dispatch and uploaded-media routes so persisted production content remains visible across deployments.
- Replaced remote repository access in Lighthouse with bounded local project-source access.
- Removed the branch/PR/CI Operation Console and its release/canary machinery.
- Replaced release checks that depended on version-control metadata with direct filesystem validation.
- Disabled automatic Git-triggered deployments in `vercel.json`.
- Added `npm run deploy:prod`, `npm run storage:create` and `npm run storage:list`.
- Installer now preserves user content, media, local state, environment files and Vercel project linking while removing obsolete metadata, generated output and test debris.
- Public dispatches now fail safe to deployment content when Blob is not configured; production writes remain blocked until durable storage exists.
- Added a permanent VCS-independence release gate so GitHub/PR/Actions/git-push deployment dependencies cannot silently return.

## Public UI clarity pass

- Core: mobile sections now use progressive disclosure, with dense architecture lists hidden by default and opened one section at a time.
- Core: the redundant three-card chapter jump navigation is hidden on narrow screens; the existing structure directory remains available.
- Lähetykset / Dispatches: public post stream is now single-column at all viewport widths.
- Lighthouse Lab and Lähetyskone/admin surfaces are unchanged.
- Public Core light theme: increased `.core-receipt-state` contrast for WCAG/axe compliance on desktop.


### Public light theme hardening R7
- Home FI/EN now load `site.js`, so the public light/dark toggle is interactive outside Core as intended.
- Light theme contrast hardened for gateway CTAs, identity details, contact form controls and published article typography.
- Public-only regression tests cover home theme wiring and dark-only text leakage. Lighthouse Lab and Lähetyskone remain unchanged.

## Public Core light-theme readability R8 · 2026-08-31
- Rebuilt the public Core light theme as a first-class palette instead of inheriting dark translucent surfaces.
- Replaced grey-on-grey evidence, agent, orchestra, capability, runtime and receipt panels with high-contrast warm-white surfaces.
- Hardened metadata, chips, helper text, search controls, route labels, tool states and technical code tokens for human readability.
- Kept Lighthouse Lab and Lähetyskone/admin styling untouched.

### 1.23.0 public light theme R10
- Poistettu julkisen vaalean teeman viimeiset dark-mode-valkoiset tekstiperinnöt bio-korteista, pinned/audience-pill-elementeistä ja väite/evidenssi-disclosuresta.
- Evidenssikortit saivat vaaleassa teemassa eksplisiittiset teksti-, linkki-, status-, pinta- ja reunavärit.
- Lisätty regressionvartija tunnetuille white-on-light -selektoreille.

- R12: completed public light-theme contrast sweep for Core hero copy, SHA/hash/code tokens, workspace/tool/model microcopy and receipt surfaces.

## R3 CSS ownership fix
- Moved Lighthouse responsive rules into admin-responsive.css.
- Responsive owner is now last in admin CSS cascade.
