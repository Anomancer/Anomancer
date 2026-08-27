# Anomancer 16.8.3 · Full Release

Sisältää 16.8.0 Core Shell Semanticsin, 16.8.1 Responsive Workspace Navigationin, 16.8.2 Narramancer Authoring Maturityn ja 16.8.3 Evidence Interaction -kerroksen.

16.8.3 toteuttaa auditin Evidence Interaction -vaiheen ilman evidenssin serveripuolen totuusmallin muuttamista.

## Toimitettu

- rakenteiset väitekortit: tila, väite, evidenssilähteet ja huomio
- rakenteiset lähdekortit sekä manuaalinen lähteen lisäys ilman putkimuodon kirjoittamista
- varmennetut lähteet valittavissa suoraan väitteen evidenssiksi
- ehdokaslähde näkyy provisionaalisena mutta ei kelpaa `supported`-väitteen tarkistetuksi evidenssiksi
- evidenssin valmiusmittari: tarkistetut lähteet, julkaisuvalmiit väitteet ja portin tila
- julkaisuesteet näkyvät Evidenssi-näkymässä jo ennen julkaisuikkunaa
- `supported`-väitteen puuttuva tarkistettu lähde näkyy suoraan väitekortissa
- putki- ja JSON-muodot säilytetty Tekninen data -osion alla
- nykyiset Evidence Layer-, human verification-, Artifact Boundary- ja publish gate -sopimukset säilyvät
- uusi `scripts/test-evidence-interaction-1683.mjs`

## Hyväksyntä

Tavallisen evidenssikerroksen voi rakentaa ja tarkistaa kirjoittamatta putkimuotoa tai JSONia käsin. Serveri säilyy lopullisena julkaisuporttina.
