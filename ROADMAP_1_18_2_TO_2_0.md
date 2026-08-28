# ANOMANCER ROADMAP

## 1.18.2 → 2.0

Nykytila:

```text
CORE
├── Workspace Runtime
├── Mancer Package Runtime
├── Anomancer
├── Romancer
├── Codemancer
├── Shared Agent Pool
├── Orchestra Runtime
├── Capability Registry
│   └── Nanomancer
├── Archive
│   └── Arkistonhoitaja
├── Evidence Layer
├── Artifact Boundary
├── Constitution Runtime
├── Human Approval
├── Model Router
├── Tool Broker
└── Visual / Dialog / Responsive System

```

1.18.2\:n jälkeen perusrunko on siinä kunnossa, että seuraavaksi rakennetaan ensisijaisesti **uusia maailmoja ja niiden välistä infrastruktuuria**, ei enää Coren perustuksia uudestaan.

---

# 1.18.3 — CODEMANCER WORKBENCH

Codemancer syvennetään oikeaksi päivittäiseksi kehitystyötilaksi.

## Lisää

```text
Project
Architecture
Code
Tasks
Tests
Runs
Review
Release
Documentation

```

muutetaan aidosti toimiviksi työpinnoiksi.

### Project

- projektin metadata
- repository
- runtime
- kieli / framework
- projektin tila
- tavoitteet

### Architecture

- komponentit
- moduulit
- riippuvuudet
- rajapinnat
- architectural decisions
- ADR-objektit

### Code

- tiedostopuu
- tiedostonäkymä
- diff
- ehdotettu muutos
- staged change

Ei vielä automaattista repositoryyn kirjoittamista ilman hyväksyntää.

### Tasks

```text
TODO
IN PROGRESS
BLOCKED
REVIEW
DONE

```

Tehtävä voi syntyä:

- ihmiseltä
- agentilta
- auditista
- testivirheestä
- orkesteriajosta

### Tests

- testiryhmät
- ajohistoria
- regressiot
- ennen/jälkeen
- Nanomancer-vertailu

### Review

Yksi yhtenäinen hyväksymispinta:

```text
MUUTOKSET
TESTIT
REGRESSIOT
RISKI
NANOMANCER
AGENT REVIEW

↓
IHMINEN

HYLKÄÄ
PYYDÄ MUUTOKSIA
HYVÄKSY

```

### Release

Ensimmäinen versio release-pipeline-ajattelusta:

```text
check
↓
build
↓
tests
↓
diff
↓
release notes
↓
human approval
↓
package

```

---

# 1.18.4 — MANCER PACKAGE SPEC HARDENING

Codemancerin jälkeen lukitaan se, mitä ensimmäisestä oikeasta package-testistä opittiin.

## Mancer Package Spec v1.1

Lisätään:

- schema versioning
- dependency declarations
- capability requirements
- migrations
- package health
- compatibility range
- feature flags
- install validation
- package disable / enable
- package upgrade

Esimerkiksi:

```json
{
  "requires": {
    "core": ">=1.18",
    "capabilities": [
      "archive-query",
      "nanomancer"
    ]
  }
}

```

## Tärkeä testi

Uuden test-Mancerin pitää voida tulla järjestelmään ilman Core-koodimuutosta.

Jos testi tarvitsee:

```js
if (workspace === "testmancer")

```

Package Spec ei ole valmis.

---

# 1.19.0 — AUDITOMANCER

Seuraava oikea Mancer.

Tämä on erityisen hyödyllinen, koska sitä voidaan heti käyttää itse Anomanceriin.

```text
Scope
Inventory
Findings
Evidence
Risk
Severity
Recommendations
Regression
Report

```

## Auditomancer osaa tarkastaa

- ohjelmistot
- agenttijärjestelmät
- Mancer-paketit
- orkesterit
- UI/UX
- saavutettavuuden
- tietoturvarajoja
- evidenssiketjut
- AI-järjestelmien toimivallan
- semanttiset ristiriidat

### Ensimmäinen koetus

```text
AUDITOMANCER
↓
avaa ANOMANCER CORE
↓
audit
↓
löydökset
↓
Evidence
↓
korjausehdotukset
↓
CODEMANCER

```

Tästä syntyy ensimmäinen oikea:

```text
Auditomancer
→ Codemancer
→ Nanomancer
→ Human

```

-kehä.

---

# 1.20.0 — DATAMANCER

Tutkimus- ja analyysityötila.

```text
Research Question
Hypotheses
Dataset
Variables
Methods
Analysis
Results
Uncertainty
Report

```

Näkyvä käyttöliittymä suomeksi:

```text
Tutkimuskysymys
Hypoteesit
Aineisto
Muuttujat
Menetelmät
Analyysi
Tulokset
Epävarmuus
Raportti

```

## Datamancerin erityisraja

Tulos ≠ tulkinta.

Esimerkiksi:

```text
DATA
↓
ANALYSIS
↓
RESULT
↓
INTERPRETATION
↓
CLAIM

```

eri objekteina.

Nanomancer toimii täällä luonnollisesti:

- vertailu
- poikkeamat
- jakaumat
- cross-run
- analyysimenetelmien vertailu

---

# 1.21.0 — STYLEMANCER

Visuaalisen työn maailma.

```text
Brief
Identity
Components
Typography
Layout
Assets
UI
CSS
Review
Export

```

Stylemancer voi käsitellä:

- UI/UX
- design system
- CSS
- typografia
- spacing
- värit
- komponentit
- kuvat
- kuvitus
- visuaalinen QA

Tärkeä ero:

**Stylemancer ei ole vain kuvageneraattori.**

Se ymmärtää visuaalisen järjestelmän artefakteina ja suhteina.

Esimerkiksi:

```text
design token
↓
component
↓
page
↓
browser render
↓
visual regression

```

---

# 1.22.0 — TEACHMANCER

Pedagoginen työtila.

```text
Goals
Prerequisites
Curriculum
Lessons
Exercises
Assessment
Feedback
Progress
Material

```

Sopii esimerkiksi TEE-kielen opettamiseen.

## Mahdollinen workflow

```text
Codemancer
→ TEE specification

Archive
↓
Teachmancer

→ oppimistavoitteet
→ harjoitukset
→ testit
→ vaikeustasot
→ palaute

```

Sama tekninen aineisto voidaan siis muuttaa hallitusti opetukseksi.

---

# 1.23.0 — ECOMANCER

Markkina-, rahoitus- ja riskianalyysityötila.

```text
Market
Thesis
Data
Scenario
Risk
Portfolio
Hedge
Decision
Review

```

Painotus analyysissä ja päätöksenteon läpinäkyvyydessä.

Ei mallia, joka vain sanoo:

> OSTA.

Vaan:

```text
havainto
↓
oletus
↓
skenaario
↓
riski
↓
vastaskenaario
↓
päätösehdotus
↓
ihminen

```

Ecomancer pysyy analyysityökaluna eikä autonomisena kaupankäyntijärjestelmänä.

---

# 1.24.0 — CYBOMANCER

Valtuutettu turvallisuus- ja adversarial-testing -työtila.

```text
Scope
Assets
Threat Model
Attack Surface
Tests
Findings
Evidence
Mitigation
Regression
Report

```

## Rajat

Cybomancer rakennetaan lähtökohtaisesti:

- omiin järjestelmiin
- eksplisiittisesti sallittuihin kohteisiin
- sandboxiin
- CTF/testiympäristöihin

Scope kuuluu Constitutioniin.

```text
NO SCOPE
→ NO RUN

```

---

# 1.25.0 — ORCHESTRA REGISTRY V2

Tässä kohtaa orkesterit lakkaavat olemasta vain agenttilistoja.

Stage voi olla:

```text
AGENT
PLUGIN
TOOL
ARCHIVE QUERY
MODEL
CHECKPOINT
HUMAN APPROVAL
OUTPUT ADAPTER

```

Esimerkiksi:

```text
CODE REVIEW ORCHESTRA

1. Planner             AGENT
2. Archive Query       MEMORY
3. Code Reviewer       AGENT
4. Test Runner         TOOL
5. Nanomancer          PLUGIN
6. Security Review     AGENT
7. Human Checkpoint    APPROVAL
8. Artifact Builder    OUTPUT

```

Tässä Nanomancer pääsee lopulta oikeasti orkesteriin plugin-stagena.

---

# 1.26.0 — CONTEXT GATEWAY

Arkiston muistikerros syvennetään.

Nykyinen Context Receipt muuttuu varsinaiseksi context-runtimeksi.

```text
TASK
↓
WORKSPACE POLICY
↓
ORCHESTRA POLICY
↓
ARCHIVE QUERY
↓
CONTEXT GATEWAY
↓
SELECTED MEMORY
↓
MODEL

```

## Context Inspector

Käyttäjä voi nähdä ennen ajoa:

```text
TÄMÄ AJO SAA LUKEA

✓ project specification
✓ approved architecture
✓ previous test reports

EI SAA LUKEA

× Romancer
× Ecomancer
× personal notes
× other projects

```

Tämä on käyttäjän hallittu muistimalli.

---

# 1.27.0 — ARCHIVE GRAPH

Arkisto saa varsinaisen suhdeverkon.

```text
Project
├── Decision
├── Artifact
├── Run
├── Source
├── Audit
└── Dataset

```

Mahdollisia suhteita:

```text
DERIVED_FROM
SUPERSEDES
VALIDATED_BY
CONTRADICTS
USES
GENERATED_BY
AUDITED_BY
RELATED_TO

```

Arkistonhoitaja voi ehdottaa linkkejä.

Ihminen voi hyväksyä kriittiset suhteet.

---

# 1.28.0 — MULTI-MODEL RUNTIME

Kun oma koneisto on ensin stressitestattu kunnolla, avataan portit useammille malliperheille.

```text
Model Router
├── OpenAI
├── Anthropic
├── Google
├── DeepSeek
├── Local
└── future providers

```

Orkesteri ei tarvitse yhtä mallia.

Esimerkiksi:

```text
halpa luokittelija
↓
vahva analyysimalli
↓
Nanomancer
↓
kriitikko toiselta malliperheeltä
↓
human approval

```

## Mukaan

- cost budget
- token budget
- model allowlist
- provider health
- timeout
- fallback
- model receipt
- per-stage routing

Ei automaattista “käytä kalleinta mahdollista mörköä”.

---

# 1.29.0 — TOOL SANDBOX

Tool Broker kovetetaan uudelle Mancer-maailmalle.

Esimerkiksi Codemancer tarvitsee aikanaan:

```text
File Read
File Write
Code Execution
Tests
Git Diff
Git Status
Build

```

Mutta ei näin:

```text
AI
↓
shell
↓
sudo rm -rf todellisuus

```

Vaan:

```text
Orchestra
↓
Capability Permission
↓
Tool Broker
↓
Sandbox
↓
Receipt
↓
Human approval

```

---

# 1.30.0 — SELF-HOSTED DEVELOPMENT LOOP

Tämä olisi iso merkkipaalu.

Codemancer avaa Anomancerin itsensä projektina.

```text
ANOMANCER SOURCE
↓
CODEMANCER
↓
TASK
↓
AGENTS
↓
CODE CHANGE PROPOSAL
↓
TESTS
↓
NANOMANCER
↓
AUDITOMANCER
↓
HUMAN REVIEW
↓
APPLY

```

Tässä vaiheessa oma järjestelmä auttaa jo systemaattisesti kehittämään itseään.

Ei autonomisesti.

Vaan hallitun kehityssilmukan kautta.

---

# 1.31.0 — CROSS-MANCER WORKFLOWS

Mancerit voivat muodostaa suurempia prosesseja Arkiston kautta.

Esimerkiksi:

```text
DATAMANCER
↓
tutkimustulos
↓
ARCHIVE
↓
AUDITOMANCER
↓
metodiarvio
↓
ARCHIVE
↓
TEACHMANCER
↓
opetusmateriaali
↓
STYLEMANCER
↓
visuaalinen julkaisu

```

Työtilat eivät saa suoraa pääsyä toistensa sisäiseen tilaan.

Yhteys tapahtuu:

```text
Artifact
Archive
Grant
Context Gateway

```

-ketjun kautta.

---

# 1.32.0 — COMMAND PALETTE / CORE SEARCH

Kun työtiloja on paljon, navigointi ei voi perustua pelkkiin välilehtiin.

Lisätään:

```text
Ctrl / Cmd + K

```

ja:

```text
avaa Codemancer
etsi projekti
avaa ajo 0817
hae Arkistosta parser
aja orkesteri
avaa asetukset

```

Yksi globaali komentopinta.

---

# 1.33.0 — OBSERVABILITY

Core alkaa mitata itseään.

```text
runs
latency
cost
models
errors
retries
tool calls
archive reads
context size
approval waits
regressions

```

Konehuone muuttuu oikeaksi observability-pinnaksi.

Ei vain “mitä agentteja on olemassa”, vaan:

> mitä järjestelmä tekee juuri nyt ja kuinka hyvin.

---

# 1.34.0 — POLICY / CONSTITUTION INSPECTOR

Constitutionit ovat jo keskeinen osa järjestelmää.

Niille rakennetaan oma tarkastelupinta:

```text
Mancer
↓
Constitution
↓
Capabilities
↓
Denied actions
↓
Approval gates
↓
Archive permissions
↓
Tool permissions

```

Käyttäjä pystyy siis tarkistamaan:

> mitä tämä työtila oikeasti saa tehdä?

ennen ensimmäistäkään ajoa.

---

# 1.35.0 — BACKUP / EXPORT / RESTORE

Koska Arkisto alkaa olla arvokas, tarvitaan kunnollinen poistumistie.

```text
EXPORT
├── projects
├── artifacts
├── archive
├── receipts
├── constitutions
├── Mancer packages
└── settings

```

Muodot esimerkiksi:

```text
JSON
Markdown
ZIP

```

Ja takaisin:

```text
IMPORT
↓
VALIDATE
↓
PREVIEW
↓
HUMAN APPROVAL
↓
RESTORE

```

---

# 1.4x — PERSONAL HARDENING

Ennen kuin edes harkitaan muiden käyttäjien päästämistä järjestelmään:

- pitkäaikainen oma käyttö
- oikeita Codemancer-projekteja
- oikeita Auditomancer-auditointeja
- useita malliperheitä
- tuhansia orkesterivaiheita
- virheiden ja epäonnistumisten analyysi
- Archive-kasvun testaus
- backup/restore-testit
- kustannusten kalibrointi
- käyttöoikeusrajojen stressitestaus
- sandbox-testit

Tämä vaihe voi kestää kauan.

Se on tarkoitus.

---

# 2.0 — OPTIONAL MULTI-USER CORE

Vasta jos joskus oikeasti halutaan muiden käyttöön.

2.0 EI tarkoita vain:

> lisää login.

Se tarkoittaa kokonaan uutta turvallisuusmallia:

```text
USER
↓
ORGANIZATION
↓
TENANT BOUNDARY
↓
WORKSPACE
↓
ARCHIVE
↓
MODEL KEYS
↓
BUDGETS
↓
TOOLS

```

Tarvitaan esimerkiksi:

- tenant isolation
- käyttäjäkohtaiset Archive Storet
- organisaatiot
- käyttöoikeusroolit
- secret vault
- API key isolation
- kustannuskiintiöt
- rate limits
- abuse prevention
- audit log
- retention policy
- account deletion
- export
- billing
- käyttöehdot
- tietosuojakerros

Tätä ei rakenneta ennen kuin henkilökohtainen järjestelmä on todistanut itsensä.

---

# TÄRKEIN JULKAISUJÄRJESTYS

Lyhyesti:

```text
NYT
1.18.2
Native Dialog Consolidation
        │
        ▼
1.18.3
Codemancer Workbench
        │
        ▼
1.18.4
Mancer Package Spec Hardening
        │
        ▼
1.19
Auditomancer
        │
        ▼
1.20
Datamancer
        │
        ▼
1.21
Stylemancer
        │
        ▼
1.22
Teachmancer
        │
        ▼
1.23
Ecomancer
        │
        ▼
1.24
Cybomancer
        │
        ▼
1.25
Orchestra Registry V2
        │
        ▼
1.26
Context Gateway
        │
        ▼
1.27
Archive Graph
        │
        ▼
1.28
Multi-model Runtime
        │
        ▼
1.29
Tool Sandbox
        │
        ▼
1.30
Self-hosted Development Loop
        │
        ▼
1.31+
Cross-Mancer / Observability / Policy / Backup
        │
        ▼
1.4x
PERSONAL STRESS TEST ERA
        │
        ▼
2.0?
MULTI-USER

```

# Perusperiaate koko roadmapille

Anomancerin ei pitäisi kasvaa ominaisuuslistana.

Sen pitäisi kasvaa näin:

```text
CORE
    pysyy pienenä ja yleisenä

MANCERS
    määrittelevät työn maailmat

AGENTS
    tuovat roolit

CAPABILITIES
    tuovat instrumentit

ORCHESTRAS
    yhdistävät työn

ARCHIVE
    säilyttää jäljen

CONTEXT GATEWAY
    hallitsee muistia

CONSTITUTION
    rajaa toimintaa

HUMAN
    pitää vallan

```

Tavoite ei siis ole rakentaa yhtä valtavaa AI-sovellusta.

Tavoite on rakentaa **hallittu runtime, johon voidaan asentaa erilaisia työn todellisuuksia ilman että Core muuttuu jokaisen uuden idean mukana uudeksi hirviöksi.**