# Lighthouse Compute Runtime v1 + Task Graph v1

Compute Runtime erottaa deterministisen laskennan kielimallipäättelystä.

```text
ProblemModel
→ Capability Match
→ Task Graph
→ read-only / compute / reasoning / proposal / approval
```

Ensimmäinen adapteri on `compute.tabular.v1`. Se käsittelee rajatusti työtilan CSV-, TSV- ja taulukkomuotoista JSON-aineistoa ilman shell-komentoja, evalia tai ulkoisia sivuvaikutuksia.

Compute-reitille siirtyvät `data.profile`, `data.analyze`, `data.compare`, `data.anomaly.detect`, `data.visualize`, `timeseries.analyze`, `statistics.describe` ja `statistics.uncertainty`.

Runtime laskee deterministisesti profiileja, kuvailevia tilastoja, Pearson-korrelaatioita, IQR-poikkeamaehdokkaita, ryhmävertailuja, aikasarjamuutoksia ja visualisointispecejä. Rajat: 3 datasettiä, 20 000 riviä, 200 saraketta ja 1 000 000 merkkiä per materiaali.

Task Graph muodostaa capability-listasta riippuvuusgraafin ja topologiset execution-staget. Riippumattomat kyvyt merkitään samaan rinnakkaiseen stageen. Task Graph v1 on nyt myös ajettava bounded-executor: se ratkaisee topologiset staget, ajaa riippumattomat kyvyt rajatulla concurrencyllä ja kirjaa stage-kohtaiset tulokset. Executorissa on timeout- ja yksi retry-kierros. Providerikohtainen ulkoinen rate-limit-ohjaus kuuluu edelleen adapterikerrokseen.

Turvarajat: compute ei kirjoita ulkoista tilaa, ei suorita käyttäjän koodia, ei käynnistä shelliä, ei hae verkkoa ja käyttää `dataEgress: none`. Laskentatulokset kirjataan Lighthouse Hands -traceen.

Tämän adapterirajan taakse voidaan myöhemmin lisätä DuckDB- tai Python-worker ilman että ProblemModel, Capability Package tai D0 täytyy rakentaa uudelleen.

## Runtime Executor

`core/runtime/task-graph-executor.js` tarjoaa muodon `anomancer-task-graph-executor/v1`. Se ei anna taskille uusia oikeuksia: runner päättää edelleen, mikä adapteri todella saa suorittaa capabilityn. Blocked/approval-solmuja ei suoriteta Hands-vaiheessa.

```text
Task Graph
  ↓
Topological stages
  ↓
Bounded executor (max 4)
  ↓
Capability adapters
  ↓
Runtime trace
```
