# Interface system

The private UI is a desktop-first workbench with explicit responsive behavior for tablet and phone.

## Ownership

`admin.css` is a stylesheet manifest. Component/area ownership is split into token, shell, workspace, editorial, narrative, control-plane, Archive, Nanomancer, Mancer and responsive layers. Breakpoint policy is centralized in `admin-responsive.css` rather than scattered across component files.

## Navigation

The interface separates global destinations from workspace-local sections. URL state owns workspace/view/section so reload and browser back/forward preserve context. Desktop rail and mobile dock are driven from workspace/editor definitions where possible.

## Interaction contracts

- visible controls meet minimum touch-target and font floors
- keyboard focus is visible
- native/custom dialogs restore focus and preserve human approval semantics
- dirty state and revision conflicts protect local work
- workspace-bound async requests are abortable and stale responses are rejected
- reduced-motion and increased-contrast modes are regression-tested

## Visual QA

Browser tests cover several viewport classes and structural invariants such as overflow, target size, focus and unnamed controls. Current visual QA is invariant-based rather than golden-image pixel comparison.

Historical lineage incorporated from `INTERFACE_SYSTEM.md`, `NAVIGATION_SHELL_16_7.md` and `VISUAL_SYSTEM_CONSOLIDATION_16_8_4.md`.
