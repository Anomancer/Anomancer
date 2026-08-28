# Live Path Verification — ympäristökohtainen canary

1.18.5:n live-polun kovennus on nyt toteutettu ja paikallinen release-portti on vihreä. Tämä tiedosto kuvaa jäljellä olevan ympäristökohtaisen canaryn, ei enää puuttuvaa sovelluslogiikkaa.

Tekninen toteutus: `LIVE_PATH_VERIFICATION_1_18_5.md`
Paikallinen validointi: `FINAL_VALIDATION_1_18_5.md`

## Portti 0 — Preflight

Aseta nimenomaan erillinen testirepo ja pakota repository-lukko:

```bash
ANOMANCER_OPERATION_REQUIRE_ALLOWLIST=1
ANOMANCER_OPERATION_REPO_ALLOWLIST=owner/test-repository
GITHUB_REPO=owner/test-repository
npm run live:preflight
```

Preflightin pitää olla GREEN ennen ensimmäistä sivuvaikutusta.

## Portti 1 — Operation Console → plan

- käytä tallennettua Codemancer-artefaktia
- luo `repository.write` plan Operation Consolesta
- varmista plan hash, artefaktirevisio, base branch + SHA, tiedostomanifesti, koko ja riskitaso
- varmista `Live-repo-lukko: SALLITTU`
- varmista ettei GitHubissa tapahdu vielä mitään

## Portti 2 — Kirjoitettu hyväksyntä

- syötä UI:n näyttämä confirmation phrase täsmälleen
- väärä phrase pitää hylätä
- hyväksynnän pitää säilyttää sama plan hash
- hyväksyntä ei vielä saa tehdä repository-writea

## Portti 3 — Execute testirepossa

- suorita hyväksytty `repository.write`
- varmista että syntyy vain `anomancer/op-*`-haara
- varmista operation commit SHA
- varmista `defaultBranchShaBefore === defaultBranchShaAfter`
- varmista `defaultBranchUnchanged = true`
- jos pohjahaara liikkuu, odotettu tulos on `drifted` ja jatkoportti sulkeutuu

## Portti 4 — Testit → PR → preview

- `tests.run` käyttää täsmällistä operation commit SHA:ta
- GitHub Actions -ajon run-name täsmää operation id + mode -sidontaan
- `npm run check` menee vihreäksi
- PR käyttää operation-haaraa eikä automergaa
- PR head SHA vastaa testattua commit SHA:ta
- preview käyttää samaa immutable commit SHA:ta
- preview ei saa production-aliasia

## Portti 5 — Evidenssin päivittyminen käyttöliittymään

Operation Consolessa pitää näkyä ulkoista todellisuutta vastaavat:

- operation branch
- commit SHA
- default branch SHA ennen/jälkeen
- workflow run id ja täsmällinen sidonta
- PR numero + head/base SHA
- merge SHA, kun PR myöhemmin yhdistetään

Reload ei saa kadottaa operation historya eikä vanha revision saa laukaista samaa sivuvaikutusta uudestaan.

## Portti 6 — Production + rollback

Production-plan saa avautua vasta kun PR on oikeasti merged, release-check on `passing` ja ihmisen release-päätös on `approved`. Production käyttää merge SHA:ta.

Rollback on erillinen critical-risk plan → written approval → execute -ketju. Deployment rollback tarvitsee eksplisiittisen aiemman deployment URL:n tai `dpl_`-id:n.

## Portti 7 — kirurginen UI/UX-kierros

Live-canaryn jälkeen tehdään erillinen pintakierros, joka ei muuta capability/governance-semanttiikkaa:

- toimimattomat ja väärin disabled-tilaan jäävät napit
- focus-visible, tab-järjestys ja dialogien fokuspalautus
- aria-live/status-viestit
- kontrasti, overflow, clipping ja responsive-reflow
- hover/active/focus/disabled-tilojen yhdenmukaisuus
- 1440×900, 1024×768, 768×1024, 390×844 ja 360×800
- reduced-motion ja increased-contrast

## Definition of Done

Live-canary on valmis vasta kun yksi kokonainen testirepo-polku on todistettavasti kulkenut:

```text
plan → written approval → execute → tests → PR → preview → merge → production → rollback
```

ja Operation Consolen evidenssi vastaa jokaisessa kohdassa GitHubin/Vercelin ulkoista todellisuutta ilman automergea, default-haaran suoraa kirjoitusta tai sivuvaikutuksen sokkona toistamista.
