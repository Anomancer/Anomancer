## 1.26.4 · Functional + Theme Closure

Lighthouse Workbenchin vakautuskierros. Tämä julkaisu sulkee jäljellä olevat vaalean teeman tummat saarekkeet ja lisää Blob-häiriöön fail-honest-selainvaratilan eristetyille työtiloille.

Keskeiset muutokset:
- Nanomancer, visualisoinnit, evidenssipinnat ja vanhat capability-kortit noudattavat vaaleaa teemaa.
- Romancer- ja Codemancer-työtila voidaan luoda selaimeen, jos Vercel Blob palauttaa 403:n. Paikallinen tila merkitään näkyvästi eikä sitä väitetä palvelimella pysyväksi.
- Paikallisten Mancer/Romancer-artefaktien luonnokset säilyvät selaimen localStoragessa.
- Uuden orkesterin tallennus ei jää odottamaan rajatta: 12 s aikakatkaisu ja selaimen paikallinen custom-orkesteri toimivat Blob-häiriössä.
- Runtime snapshot validoi myös selaimesta lähetetyn custom-orkesterin työtilan agenttirajoja vasten.
- Pinnaa- ja lähdeohjaimet on tiivistetty mobiilissa säilyttäen kosketusalueen.

Turvaraja säilyy: ihminen päättää lopullisesti, paikallinen varatila ei avaa julkaisu- tai repository-oikeuksia eikä cross-workspace-lukua.

Current package: **1.26.4-functional-theme-closure**.

Vercel Blob -vikatilassa Romancer/Codemancer ja mukautetut orkesterit voivat jatkaa tämän selaimen paikallisessa varatilassa. Pysyvä monilaite-/serverless-tallennus vaatii edelleen projektiin liitetyn toimivan private Blob -storen. `REPAIR_VERCEL_BLOB.sh` diagnosoi tilanteen eikä luo uutta storea ilman eksplisiittistä `--create`-valintaa.
