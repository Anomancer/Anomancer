# Anomancer 1.18.0 · Mancer Runtime + Codemancer

## Ydin

1.18.0 todistaa ensimmäistä kertaa, että Anomancer Core voi vastaanottaa uuden domain-työtilan ilman domain-nimikohtaista Core Shell -navigaatiota. Codemancer toimitetaan `mancers/codemancer/`-pakettina ja validoidaan Mancer Package Spec v1:n mukaisesti.

Core ei päättele toimintaa nimestä `Codemancer`. Se lukee paketin sopimukset ja muodostaa niistä Workspace Templaten, Constitution-sidoksen, Artifact Boundaryn, UI-scheman, Approval Modelin, Agent Bindingsin, Orchestra Registryn ja Archive Policyn.

## Mancer Package Spec v1

Paketti sisältää:

```text
mancers/codemancer/
├── manifest.json
├── constitution.json
├── artifact-boundary.json
├── ui-schema.json
├── approval-model.json
├── agent-bindings.json
├── orchestra-registry.json
├── archive-policy.json
└── adapters/
```

`server/mancer-registry.js` löytää package-hakemistot, validoi sopimukset fail-closed-periaatteella ja muodostaa package contract hashin. Viallista tai puutteellista pakettia ei aktivoida.

## Codemancer 1.0.0

Codemancerin UI-schema määrittelee yhdeksän työpintaa:

1. Project
2. Architecture
3. Code
4. Tasks
5. Tests
6. Runs
7. Review
8. Release
9. Documentation

Desktop rail ja mobiilidokki käyttävät samaa `editorDefinition`-metadataa kuin muutkin työtilat. Core Shellissä tai geneerisessä rendererissä ei ole `codemancer`-nimikohtaista navigaatiohaaraa.

## Schema Workbench

`admin-mancer.js` on geneerinen Mancer Package -renderer. Se osaa piirtää UI-schemasta:

- lomakeosiot
- kokoelmaosiot
- workspace-scopatun run explorerin
- package-, approval-, orchestra- ja archive-contractin yhteenvedon

Codemancer on ensimmäinen käyttäjä, mutta renderer ei tunne Codemancerin nimeä.

## Mancer Artifact Store

`server/mancer-artifact-store.js` tarjoaa package-workspaceille oman eristetyn JSON-artefaktin.

Ominaisuudet:

- workspace-id eristää datan
- memory- ja GitHub tag -backend
- revision conflict -suoja
- payloadin rakenteellinen sanitointi
- ei public branch -kirjoitusta
- ei repositoryn automaattista muokkausta
- ei deploy- tai release-sivuvaikutusta

Codemancerin `Code`-osio on 1.18.0:ssa hallittu ehdotus-/muistiinpanokerros, ei repo-editori jolla agentti voisi kirjoittaa tiedostoja käyttäjän ohi.

## Human approval

Codemancerin Approval Model määrittelee:

```text
proposal
↓
tests
↓
diff review       [human]
↓
apply             [human]
↓
release           [human]
```

1.18.0 ei vielä toteuta automaattista apply- tai deploy-adapteria. Tämä on tarkoituksellinen turvallisuusraja.

## Package-local Orchestra Registry

Codemancer määrittelee package-rekisterissä kaksi orkesteria:

- `code-review`
- `release-readiness`

Rekisteri ladataan ja näkyy package contractissa, mutta nämä ovat 1.18.0:ssa `executable:false`. Automaattinen package-plugin/orchestra stage execution kuuluu myöhempään Orchestra Registry v2 -kerrokseen.

## Archive Policy

Codemancer säilyttää 1.17-sarjan muistiperiaatteen:

```text
ARCHIVE ≠ AUTOMATIC MODEL MEMORY
```

Cross-workspace Archive-luku vaatii eksplisiittisen human grantin. Package ei saa laajentaa omaa muistioikeuttaan.

## Missing package -turvaraja

Jos workspace-record viittaa Mancer Packageen, jota ei runtime-käynnistyksessä löydy:

- alkuperäinen template-id säilytetään
- dataa ei rebindata toiseen domainiin
- domain-kyvykkyydet suljetaan
- työtila saa `workspace/missing-package-ui/v1` -safe state -profiilin
- UI näyttää lukitun puuttuvan package-tilan

Kun sama package palautetaan ja runtime käynnistyy uudelleen, workspace voidaan jälleen sitoa alkuperäiseen templateen.

## Mancer Registry UI

Työtilat-sivulla on nyt `MANCER REGISTRY` -osa. Asennettu package näkyy siellä contract hashin, UI-osioiden, package-orkesterien ja human authority -tilan kanssa. Uusi instanssi luodaan normaalin Workspace Store -polun kautta.

## Serverless packaging

`vercel.json` sisältää `mancers/**`-includeFiles-rajan admin Core- ja Content-gatewaylle, jotta domain-paketit eivät katoa serverless-bundlesta.

## Testit

1.18.0 lisää:

- `test-mancer-runtime-118.mjs` · 9 sopimus-/runtimeporttia
- `test-mancer-ui-118.mjs` · Chromium desktop 1440×900 + phone 360×800

Portit tarkistavat muun muassa package-discoveryn install/remove/reinstall-syklin, contractit, workspace-instanssin, Artifact Boundaryn, geneerisen storen, schema-rendererin ja sen ettei Core Shell hardkoodaa Codemanceria.

## Rajaus

1.18.0 ei vielä:

- kirjoita repositoryn tiedostoja automaattisesti
- aja shell-komentoja Codemancerista
- tee deployta
- anna package-orkestereille automaattista execution-runtimea
- luo uusia coding-agentteja pelkän nimen vuoksi

Tämä release todistaa ensin alustan. Seuraavat kyvykkyydet voidaan lisätä myöhemmin sopimusrajojen sisään.
