# P3 — Capability Wiring & Operational Safety · 1.18.4

## Lopputulos

Codemancerin tallennettu ja tarkistettu koodiartefakti voidaan viedä GitHubiin, testeihin ja Verceliin ilman suoraa selaimen repository- tai shell-valtaa. Jokainen sivuvaikutus on oma työtilakohtainen operation, jolla on muuttumaton plan hash, 24 tunnin voimassaolo, kirjoitettu ihmishyväksyntä, erillinen execute ja hash-ketjutettu audit-jälki.

## Porttiketju

1. Tallenna Codemancerin Koodi-, Tarkistus- ja Julkaisu-osiot.
2. Luo sivuvaikutukseton repository-write plan. Palvelin johtaa tiedostot tallennetusta artefaktirevisiosta.
3. Tarkista tiedostomanifesti, base SHA, riskitaso ja confirmation phrase.
4. Kirjoita vahvistus täsmälleen. Hyväksyntä sidotaan plan hashiin.
5. Suorita operation erillisellä komennolla. GitHubiin syntyy vain uusi `anomancer/op-*`-haara.
6. Luo ja hyväksy testiajo. GitHub Actions ajaa lukitun lähderef’in buildin ja koko `npm run check` -portin.
7. Vihreän testin jälkeen luo PR. PR:ää ei automergata.
8. Production-plan avautuu vasta yhdistetyn PR:n, vihreän release-checkin ja ihmisen hyväksytyn release-päätöksen jälkeen.
9. Production checkout ja deploy sidotaan PR:n täsmälliseen merge commit SHA:han, ei liikkuvaan haaraan.

## Capabilityt ja sivuvaikutukset

| Capability | Porttiehto | Rajattu sivuvaikutus |
|---|---|---|
| `repository.write` | review hyväksytty + kirjallinen vahvistus | uusi `anomancer/op-*`-haara täsmällisestä base SHA:sta |
| `tests.run` | onnistunut repository-operation | allowlistatun Actions-workflow’n testit |
| `git.pull-request` | vihreä testiajo | reviewattava PR, ei automergea |
| `deploy.preview` | vihreä testiajo | Vercel prebuilt preview |
| `deploy.production` | yhdistetty PR + release check + release-päätös | tarkka merge-SHA → Vercel prebuilt production |
| `repository.rollback` | yhdistämätön ja muuttumaton operation-haara | vain kyseisen haaran poisto |
| `deploy.rollback` | eksplisiittinen Vercel URL / `dpl_`-id | erillinen GitHub `production` -environment -ajo |

## Turvarajat

- Selain ei lähetä execute-vaiheessa tiedostosisältöä, Git-refiä, workflow-nimeä tai komentoa.
- Repository-operation hyväksyy 1–20 tiedostoa, enintään 300 kB/tiedosto ja 1 MB yhteensä.
- Absoluuttiset polut, `..`, `.git`, `.vercel`, `node_modules`, `.env`, credential- ja secret-polut estetään.
- Tunnetut token- ja private key -literaalit estetään ennen GitHub-kutsua.
- Muuttunut artefakti, base branch SHA, operation revision tai rollback-haara sulkee portin.
- Default-haaran refiä ei päivitetä eikä PR:ää yhdistetä adapterista.
- Operation Store ei tallenna raakaa salasuutta tai selaimelle palautettavaa tokenia.
- Production ja rollback käyttävät GitHubin `production`-environmentia. Aseta sille required reviewer.

## GitHub- ja Vercel-konfiguraatio

Vercel-projektiin tarvitaan server runtime -ympäristömuuttujat:

```text
GITHUB_CONTENT_TOKEN=<fine-grained token>
GITHUB_REPO=<owner/repository>
GITHUB_BRANCH=master
ADMIN_SESSION_SECRET=<vähintään 32 tavun satunnainen arvo>
```

Fine-grained GitHub-token rajataan vain kohderepositorioon. Se tarvitsee GitHub Git Data / Contents -kirjoituksen operation-haaraa ja operation-audit-tagia varten, Pull requests -kirjoituksen PR:n luontiin sekä Actions-kirjoituksen `workflow_dispatch`-kutsuun. Älä lisää tokenia client bundleen.

Repositoryn Actions secrets:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

Luo GitHubiin `production`-environment ja lisää required reviewer. Workflow on `.github/workflows/anomancer-capability-gate.yml`; sen Vercel CLI -versio on kiinnitetty ja deploy tapahtuu `vercel pull` → `vercel build` → `vercel deploy --prebuilt` -ketjulla.

## Käyttöönotto

```bash
cd ~/Lataukset/ANOMANCER_V1_18_4_P3_CAPABILITY_WIRING_FULL_RELEASE
chmod +x INSTALL_TO_CURRENT.sh
./INSTALL_TO_CURRENT.sh "$HOME/GitHub/Anomancer"
```

Installer ottaa palautettavan varmuuskopion, suojaa `content/`- ja `media/`-aineiston, rakentaa root/public-peilit ja ajaa koko testiketjun ennen onnistumisviestiä. Tarkista tämän jälkeen `git status`, reviewaa diffi ja tee commit itse.

## Rollback

Yhdistämättömän repository-operation rollback poistaa haaran vain, jos sen head SHA vastaa alkuperäistä operation-commitia. Yhdistettyä PR:ää ei “palauteta” poistamalla haaraa; tee silloin uusi korjaus- tai revert-operation.

Vercel rollback ottaa vain `https://*.vercel.app`, turvallisen `https://vercel.com/...` deployment-polun tai `dpl_...`-id:n. Se suunnitellaan, hyväksytään ja suoritetaan omana critical-risk-operaationaan production-environmentin kautta.
