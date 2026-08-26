# Anomancer 13.19 · Discovery Layer

Discovery Layer erottaa kolme eri asiaa toisistaan:

1. **hakukone- ja AI-hakulöydettävyys**
2. **mallikoulutuksen crawler-oikeus**
3. **koneille tarjottavat vapaaehtoiset yhteenvetoresurssit**

## Policy

`discovery-policy.json` on kerroksen lähde.

Oletus 13.19:ssa:

- `OAI-SearchBot`: julkinen sisältö sallittu, `/admin` ja `/api/admin/` estetty
- `GPTBot`: estetty kokonaan
- muut tavalliset crawlerit: julkinen sisältö sallittu, admin estetty

Tämä toteuttaa periaatteen **SEARCH ≠ TRAINING**.

## llms.txt

Build generoi juureen `/llms.txt`-tiedoston. Se sisältää:

- canonical-sivuston
- kirjoittajan
- pääreitit
- sitemap/RSS/manifest-linkit
- kaikki julkaistut Lähetykset canonical-URL:eineen
- ydinvastauksen, jos artikkelilla on Evidence Layer -answer

`llms.txt` on tässä projektissa kokeellinen convenience layer. Sitä ei käsitellä ranking-standardina eikä canonical-sisällön korvikkeena.

## discovery-manifest.json

Koneellinen yhteenveto:

- entity IDs
- kielet
- julkaistujen artikkelien määrä
- search/training-crawler-politiikka
- yksityiset polut
- sitemap, RSS, content manifest, evidence manifest ja llms endpointit

## Authority

Discovery Layer ei julkaise eikä muuta artikkeleiden sisältöä. Se generoi discovery-resurssit jo ihmisen hyväksymästä julkisesta sisällöstä.
