# Anomancer 1.26.1 · Cascade Consolidation

Tämä julkaisu viimeistelee 1.26.0:n frontend-konsolidoinnin CSS-omistajuuden osalta.

## Muutokset

- `lighthouse-ui-constitution.css` ei enää omista viewport-breakpointteja.
- Kaikki admin/workbench-viewportin reflow kuuluu `admin-responsive.css`:lle.
- Constitutionin 647 `!important`-esiintymän historiallinen pakotusketju on poistettu.
- Constitutionissa on nyt 0 `!important`-deklarointia.
- Responsive-omistajassa on 3 pakotusta, kaikki reduced-motion-turvasopimuksessa.
- Testiharness käyttää samaa CSS-järjestystä kuin tuotanto.
- Desktopin kompakti käyttöliittymä ja mobiilin 44 px kosketuskohteet säilyvät erillisinä sopimuksina.

## Tavoite

Cascade kertoo nyt omistajuuden. Uuden korjauksen ei pitäisi tarvita korkeampaa specificityä tai uutta hotfix-kerrosta vain voittaakseen vanhan säännön.

## Contextual work navigation

The hidden legacy workspace sidebar is no longer the only pointer path to Mancer sections. When **Nykyinen työ** is active, the global **Valikko** now exposes a contextual **Nykyisen työn työkalut** group for sections such as Koodi, Tehtävät, Testit and Tarkistus. This keeps the minimalist shell intact while preserving discoverable pointer navigation.

The browser harness now tests this production path instead of clicking controls that the Constitution intentionally hides.

## Gate throughput

`check-source` preserves the same `node --check` semantics but uses a bounded worker pool instead of spawning every syntax check sequentially. This keeps the source gate deterministic while removing a test-infrastructure bottleneck on larger source trees.
