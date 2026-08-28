# Anomancer 1.18.5 — Live Path Verification & Canary Gate

1.18.5 ei lisää Codemancerille uutta rajatonta toimivaltaa. Se kovettaa 1.18.4:n P3-capabilityt niin, että ensimmäinen oikea GitHub/Vercel-canary voidaan ajaa testirepossa ilman, että liikkuva haara, väärä repository tai providerin preview-poikkeus avaa tuotantoreittiä vahingossa.

## Mitä muuttui

### 1. Testirepo-lukko

Live-operaatioille voidaan pakottaa eksplisiittinen repository-allowlist:

```bash
ANOMANCER_OPERATION_REQUIRE_ALLOWLIST=1
ANOMANCER_OPERATION_REPO_ALLOWLIST=owner/anomancer-live-test
GITHUB_REPO=owner/anomancer-live-test
```

Kun lukko on pakollinen ja `GITHUB_REPO` ei kuulu allowlistiin, repository-, PR-, Actions- ja rollback-adapterit fail-closed tilaan `GITHUB_OPERATION_REPO_NOT_ALLOWED` ennen sivuvaikutusta.

Operation Console näyttää lukon tilan erillisenä runtime-porttina.

### 2. Immutable source ref

`repository.write` luo edelleen vain `anomancer/op-*`-haaran. Sen jälkeen:

- `tests.run` checkoutataan täsmällisestä operation commit SHA:sta
- `deploy.preview` checkoutataan samasta täsmällisestä commit SHA:sta
- `git.pull-request` käyttää operation-haaraa, koska PR tarvitsee haaran
- `deploy.production` käyttää edelleen merged PR:n täsmällistä merge commit SHA:ta

Näin testattu lähde ja preview-lähde eivät voi vaihtua haaran liikkeen vuoksi hyväksynnän jälkeen.

### 3. Default-haaran todistettava muuttumattomuus

Repository-write tallentaa execution-evidenssiin:

```text
defaultBranchShaBefore
defaultBranchShaAfter
defaultBranchUnchanged
```

Jos default-haara muuttuu operation-commitin aikana, operation merkitään `drifted`-tilaan. Testiportti ei avaudu. Käyttöliittymä tarjoaa operation-haaran palautuksen ja uuden planin tekemisen.

### 4. Workflow-evidenssin tiukka sidonta

GitHub Actions -ajo tunnistetaan täsmällisellä run-nimellä:

```text
Anomancer <operation-id> · <mode>
```

Pelkkä operation-id:n esiintyminen jonkin workflow-ajon otsikossa ei enää riitä. UI näyttää `Workflow-sidonta: TÄSMÄÄ`, kun oikea ajo löytyy.

### 5. Preview provider -suoja

Vercelin preview-vaihe käyttää:

```text
vercel pull --environment=preview
vercel build --target=preview
vercel deploy --prebuilt --target=preview --skip-domain
```

`--skip-domain` on tarkoituksellinen lisäsuoja tilanteeseen, jossa Vercel luokittelee uuden projektin ensimmäisen deploymentin productioniksi. Tavoite on estää production-aliasin saaminen myös providerin ensimmäisen deploymentin poikkeuksessa.

## Live-canary järjestys

### Portti 0 — Preflight

Aja paikallisesti tai samalla ympäristökonfiguraatiolla:

```bash
npm run live:preflight
```

GREEN vaatii vähintään:

- `GITHUB_CONTENT_TOKEN`
- `GITHUB_REPO`
- `GITHUB_BRANCH`
- `ANOMANCER_OPERATION_REQUIRE_ALLOWLIST=1`
- `ANOMANCER_OPERATION_REPO_ALLOWLIST` sisältää `GITHUB_REPO`:n
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- capability-workflow löytyy paketista

Preflight ei kirjoita GitHubiin eikä deployaa mitään.

### Portti 1 — Repository plan

Operation Console → `Suunnittele repository-write`.

Tarkista ennen hyväksyntää:

- artifact revision
- plan hash
- base branch + SHA
- file manifest
- tiedostomäärä ja kokonaiskoko
- riskitaso
- live-repo-lukko `SALLITTU`

### Portti 2 — Kirjoitettu hyväksyntä

Syötä UI:n confirmation phrase täsmälleen. Hyväksyntä sitoutuu plan hashiin. Tässä vaiheessa GitHubissa ei vielä saa syntyä branchia, commitia tai PR:ää.

### Portti 3 — Execute testirepossa

Suorita hyväksytty `repository.write`.

GREEN-evidenssi:

- `anomancer/op-*` syntyy
- operation commit SHA syntyy
- default branch SHA ennen/jälkeen on sama
- `defaultBranchUnchanged = true`
- audit chain kasvaa

### Portti 4 — Tests → PR → Preview

1. Luo `tests.run` plan repository-operaatiosta.
2. Hyväksy ja suorita.
3. Refresh kunnes `passed`.
4. Luo PR-plan testituloksesta.
5. Hyväksy ja suorita. PR ei automergaa.
6. Luo preview-plan samasta testituloksesta.
7. Hyväksy ja suorita. Refresh kunnes `succeeded`.

Tests ja preview käyttävät täsmällistä operation commit SHA:ta.

### Portti 5 — Evidenssi UI:ssa

Operation-kortin Live-evidenssi näyttää saatavilla olevat:

- operation branch
- commit SHA
- default branch SHA ennen/jälkeen
- workflow run id
- workflow-sidonnan
- PR numeron
- PR head/base SHA:n
- merge SHA:n

Reload ei saa kadottaa operation historya. Revision-lukko estää saman hyväksytyn executionin uudelleensuorituksen vanhalla revisiolla.

### Portti 6 — Production

Production-plan avautuu vain kun:

- PR on oikeasti merged
- PR head ei ole liikkunut testatusta commitista
- merge commit SHA on kelvollinen
- Release `check = passing`
- Release `humanApproval = approved`

Production käyttää merge SHA:ta, ei branchia.

### Portti 7 — Rollback

Rollback on edelleen erillinen critical-risk plan + written approval + execute -ketju. Repository rollback saa poistaa vain muuttumattoman julkaisemattoman operation-haaran. Deployment rollback vaatii eksplisiittisen Vercel deployment URL:n tai `dpl_`-id:n.

## Done-when

1. `npm run build` PASS.
2. `npm run check` PASS.
3. `npm run live:preflight` GREEN oikealla testirepo-konfiguraatiolla.
4. Testirepo-canary tuottaa kaikki Porttien 1–5 evidenssit.
5. PR/preview varmennetaan ilman default-haaran liikettä tai production-aliasia.
6. Production ja rollback varmennetaan erillisessä hyväksytyssä canaryssa vasta tämän jälkeen.

1.18.5-paketin paikallinen release-portti todistaa logiikan. Oikea GitHub/Vercel-live-canary on erillinen ympäristökohtainen evidenssivaihe, koska se tarvitsee käyttäjän testirepon ja CI/CD-salaisuudet.
