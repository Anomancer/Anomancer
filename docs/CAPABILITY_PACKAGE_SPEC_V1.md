# Capability Package Spec v1

Capability Package Spec tekee yksittäisestä Anomancer-kyvystä asennettavan, validoitavan ja reititettävän sopimuspaketin.

## Tavoite

```text
D0
→ ProblemModel
→ Capability Registry
→ Capability Package
→ Capability Router
→ runtime / reasoning / proposal / approval
```

## Paketin rakenne

```text
capabilities/
└── capability.id/
    ├── manifest.json
    ├── contract.json
    ├── permissions.json
    └── adapter.json
```

Yksi hakemisto vastaa yhtä capability-id:tä. Hakemiston nimen täytyy vastata `manifest.id`:tä.

`manifest.json` määrittää identiteetin, tarkoituksen, saatavuuden ja reitityksen.
`contract.json` määrittää inputit, outputit ja lupaukset.
`permissions.json` määrittää toimivallan ja data-egressin.
`adapter.json` sitoo kyvyn olemassa olevaan runtime-luokkaan.

Reitit ovat `read-only`, `reasoning`, `proposal` ja `approval`.

V1 ei lataa paketista suoritettavaa `adapter.js`:ää. Tämä on tarkoituksellinen turvaraja: paketin asentaminen ei saa itsessään tarkoittaa mielivaltaisen palvelinkoodin suorittamista. Uusi oikea tool-adapteri rekisteröidään erikseen Tool Brokeriin ja paketti viittaa siihen symbolisella `runtimeAdapter`-id:llä.

Build-polku:

```text
capabilities/*
→ server/capability-package-registry.js
→ scripts/sync-capability-packages.mjs
→ core/capabilities/packages.generated.js
→ core/capabilities/registry.js
→ matcher
→ router
→ Lighthouse Kyvyt
```

Turvainvariantit:

1. Capability package ei saa itse korottaa oikeuksiaan.
2. External write vaatii ihmishyväksynnän.
3. Proposal ei ole write.
4. Read-only ei saa kirjoittaa ulkoista tilaa.
5. Paketti ei saa ladata omaa executable-moduulia v1:ssä.
6. Rikkinäinen paketti rikkoo buildin näkyvästi eikä katoa hiljaa.
7. Capability-id:t eivät saa törmätä built-in registryyn tai toisiinsa.

Ensimmäinen referenssipaketti on `capabilities/comparison`. Se siirtää olemassa olevan `comparison`-kyvyn pois Coren kovakoodatusta taulukosta.
