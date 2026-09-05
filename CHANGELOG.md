## 1.30.0 - Local Model Layer

- Added `qwen-local` Model Router targets for research, writer, and critic routes.
- Added OpenAI-compatible local `/v1/chat/completions` transport.
- Added environment-based local model configuration.
- Preserved human approval as the publication boundary.

# v1.29.0 · Signal → Lähetys

- Added normalized Signal input (`anomancer-signal/v1`).
- Signals can become Lighthouse intents without bypassing authority or approval boundaries.
- Supported signal types: user, URL, RSS, trend, GitHub, web and system.
- Signal metadata is preserved in runtime output for traceability.
- Existing capability routing and Task Graph execution remain the execution layer.

# Changelog

## v1.28.0 · Orchestrator / Task Graph Runtime

- Task Graph siirtyi scheduler-sopimuksesta oikeaksi bounded executoriksi.
- Riippumattomat read-only- ja compute-kyvyt voidaan ajaa rinnakkain rajatulla concurrencyllä.
- Executor tukee timeout- ja retry-käytäntöjä sekä stage-kohtaista runtime-jälkeä.
- Lighthouse Hands käyttää Task Graphia suoritusjärjestyksen lähteenä.
- Runtime-vastauksessa säilytetään `taskGraphRun` diagnostiikkaa varten.
- Human authority / external side-effect -raja pysyy ennallaan.

## 1.26.4 · Functional + Theme Closure

- Light-theme closure: Nanomancer, visualizations, evidence/source/claim surfaces.
- Browser-local workspace fallback for Vercel Blob read/write outages.
- Browser-local artifacts for Codemancer/Romancer fallback workspaces.
- Custom orchestra timeout + browser-local fallback; runtime snapshot accepts a server-validated custom orchestra override.
- Compact mobile pin/source controls.
- New regression gate: browser-local fallback + theme closure.

## 1.26.3 · Mobile Consistency Hotfix

- Light theme now owns Core agent, tool, orchestra, run and runtime-control surfaces instead of mixing white shells with dark cards.
- Agent profile dialogs are fully theme-consistent in light mode.
- Workspace mobile tool sheet keeps title and helper copy on separate rows.
- Editorial orchestra surface and disclosures follow the same light-theme hierarchy as the surrounding editor.
- Mobile workspace identity band is tightened again without changing the bottom-dock touch contract.
- Boot/loading state inherits the selected theme with readable Lighthouse contrast.
- Added regression coverage for light control-plane surfaces and mobile tool-sheet layout.

## 1.26.2 · Mobile Cosmetic Polish

- Mobile workspace header density pass.
- Compact mobile dock and save/publish action strip.
- Light-theme contrast fixes for mixed dark surfaces.
- Menu footer mode-label duplication fixed.
- Mobile native dialogs tightened without reducing touch targets below 44 px.
- Machine-room metric labels wrap safely on narrow phones.

## 1.26.1 · Cascade Consolidation
- `check-source` käyttää rajattua rinnakkaisuutta, jotta 200+ JS-tiedoston syntaksiportti ei muodosta tarpeetonta release-gate-pullonkaulaa.
- Nykyisen työn paikalliset työkalut siirtyvät kontekstuaalisesti Valikkoon, jotta piilotettu legacy-sivupalkki ei katkaise pointer-navigaatiota.

- siirretty kaikki Lighthouse Constitutionin viewport-media queryt `admin-responsive.css`:ään
- `lighthouse-ui-constitution.css`: 0 viewport-media queryä, 0 `!important`-deklarointia
- `admin-responsive.css`: vain 3 `!important`-deklarointia, kaikki reduced-motion-sopimuksessa
- `admin.css` lataa Constitutionin ennen kanonista responsive-omistajaa
- `readAdminCss()` vastaa nyt tuotannon todellista CSS-importtijärjestystä
- desktopin kompaktit kontrollit säilyvät, mobiilissa 44 px kosketuslattia
- visual-system-regressiotesti validoi myös Constitution-cascaden

## 1.26.0 · Lighthouse Frontend Consolidation

- Split the 3,500-line Lighthouse stylesheet into ordered ownership modules behind a tiny `lab.css` manifest.
- Build now publishes the imported Lighthouse style graph and tests read the same composed source graph.
- Added semantic Lighthouse palette tokens for repeated canvas, panel, border, text and accent values without changing their colors.
- Raised direct Lighthouse metadata text to a 12 px minimum and applied the same readability floor to the Workbench Constitution.
- Added a centralized coarse-pointer 44 px interaction contract and shared `:focus-visible` policy.
- Added a regression test that prevents the Lighthouse CSS from silently collapsing back into one monolith.
- Fixed the source-export allowlist so the Lighthouse Constitution, PWA runtime and service worker cannot disappear from a source release.


## 1.25.7 · Lighthouse P2.6 Mobile Hardening

- Restores the Constitution-hidden mobile dock and keeps five thumb-reachable navigation slots.
- Simplifies the mobile action rail to Save + Publish; Preview remains a dedicated dock/overlay action.
- Normalizes mobile geometry for Dashboard, Mancers, Editor, Archive, Runs, Publications, Settings and Machine Room.
- Hardens dialogs, bottom sheets, safe-area spacing, horizontal overflow and 16px form inputs.
- Adds full dark/light parity for mobile chrome, preview and bottom sheets.
- Disables expensive phone backdrop blurs and bumps the Lighthouse PWA cache to p2.6-mobile-hardening.
# Changelog

## 1.25.7 Lighthouse UI Constitution P1
- Rebuilt Työpöytä hierarchy around one focal current-work panel and three equal next-step cards: Mancerit, Ajot and Julkaisut.
- Unified top-level Page Header markup across Mancerit, Aineisto, Arkisto, Ajot, Julkaisut, Asetukset and Konehuone.
- Added shared 24/14 px page and section spacing rhythm and aligned panel/list/settings geometry to it.
- Removed decorative panel gradients from Constitution surfaces so accent remains reserved for actions and meaningful state.
- Added live publication count to the dashboard and responsive 3 → 2 → 1 column behavior.
- Bumped the Lighthouse PWA cache generation so P1 CSS is not masked by a stale shell cache.

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
## 1.25.7 Lighthouse P2.5 Header / Action / Theme Cleanup
- Workspace context header is no longer sticky or overlaying editor content.
- Default success notifications are silent; warnings and errors remain visible.
- Desktop page actions are compact while mobile keeps 44 px targets.
- Light theme now explicitly owns editor, archive, forms, technical surfaces and action controls.
- Firefox no longer paints the workspace page header as a separate dark compositor bar.
