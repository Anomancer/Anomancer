# Anomancer 1.17.2 · Nanomancer

Nanomancer on Coren ensimmäinen uudelleenkäytettävä **Capability Plugin**. Se ei ole uusi työtila eikä uusi agenttipersoona, vaan read-only analyysiin tarkoitettu instrumentti, jota voidaan kutsua minkä tahansa työtilan kontekstissa.

## Capability Contract

`server/capability-registry.js` määrittelee versionoidun `anomancer-capability-plugin/v1`-sopimuksen. Nanomancer ilmoittaa eksplisiittisesti:

- `sideEffects: false`
- `modelAccess: none`
- `workspaceWrite: none`
- `archiveWrite: none`
- `runs: read-own-workspace`
- `archive: read-granted`
- automaattinen persistointi: ei
- analyysin tallentaminen Arkistoon vaatii ihmisen erillisen hyväksynnän

## Operaatiot

- `compare` — yleinen rakenteinen vertailu
- `diff` — polkukohtainen lisäys / poisto / muutos
- `consistency` — yhtenevyys- ja ristiriitahavainnot
- `deviation` — numeeriset delta- ja prosenttipoikkeamat
- `cross-run` — saman työtilan Run Recordien käyttö-, tila- ja receipt-rakenteen vertailu

Nanomancer ei tee näissä operaatioissa LLM-kutsua. Vertailu on deterministinen ja saman inputin `analysisHash` pysyy samana.

## Syötteet

Nanomancer hyväksyy 2–8 syötettä:

1. **Archive Object** — vain jos aktiivinen työtila omistaa objektin tai ihminen on myöntänyt sille read grantin. Arkistokontekstista syntyy Context Receipt.
2. **Run Record** — vain aktiivisen työtilan server-side Run Storesta. Raakapromptteja tai raakaoutputteja ei ole Run Storessa.
3. **Structured JSON** — käyttäjän eksplisiittisesti antama rakenteinen inline-syöte, kokorajoitettuna.

## Output

Tulos on `anomancer-nanomancer-analysis/v1`:

- input-deskriptorit ja hashit
- vertailukohtaiset polkumuutokset
- numeeriset deltat
- yhteenvetomittarit
- strukturoitu findings-lista
- mahdollinen Context Receipt ID
- SHA-256 `analysisHash`
- `modelUsed: false`
- `sideEffects: false`

## UI

Konehuoneessa on **Analyysimikroskooppi**, jossa kaksi Archive-objektia, ajoa tai JSON-rakennetta voidaan verrata. Tulos näyttää metriikat, findings-havainnot ja avattavan polkudiffin.

`Tallenna analyysi Arkistoon…` on tarkoituksella erillinen human-approved toiminto. Nanomancer-runtime ei tee sitä itse.

## Rajat

Nanomancer 1.17.2 ei vielä ole automaattinen orkesterivaihe. Capability API hyväksyy orchestra/run-kontekstin, mutta Orchestra Registry v2:n varsinainen plugin-stage-sidonta tehdään myöhemmässä Mancer Runtime -vaiheessa.

Tämä pitää 1.17.2:n turvallisuusmallin yksinkertaisena: ensin instrumentti, sen jälkeen automaattinen orkesterisijoittelu.
