# Anomancer 1.26.4 · Functional + Theme Closure

Tavoite: sulkea 1.26.3:n jäljellä olevat mobiilin teema- ja toimintavirheet ilman että Vercel Blob -häiriö estää eristettyjen työtilojen paikallisen käytön.

## Korjattu

- Nanomancerin ja visualisointien vaalea teema.
- Pinnaa- ja lähdeohjainten mobiilitiheys.
- Romancer/Codemancer: selaimeen rajattu fallback-työtila, kun Blob ei ole luettavissa.
- Mancer/Romancer: paikallinen artefaktitallennus fallback-työtilassa.
- Custom orchestra: 12 s timeout, paikallinen fallback, ei jäätyvää dialogia.
- Runtime snapshot validoi clientiltä toimitetun custom-orkesterin serverillä.

## Fail-honest-raja

Paikallinen fallback näkyy käyttäjälle selaimen varatilana. Se ei ole durable Vercel-tallennus, ei synkronoidu laitteiden välillä eikä anna uusia julkaisu-, arkisto- tai repository-oikeuksia.

- Pin control ownership fix: mobile compact geometry now belongs to `.pin-field` itself, not only `.meta-grid .pin-field`, so standalone and embedded renders share the same <=60px contract.
