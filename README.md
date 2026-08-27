# Anomancer 1.18.0 · Mancer Runtime + Codemancer

1.18.0 todistaa Anomancer Coren package-pohjaisen työtilamallin ensimmäisellä uudella domainilla: **Codemancerilla**.

Codemancer ei ole Core Shelliin kovakoodattu uusi sovellus. Se asennetaan `mancers/codemancer/`-pakettina, jonka sopimuksista Core muodostaa työtilan navigaation, Constitutionin, Artifact Boundaryn, Approval Modelin, Agent Bindingsin, Orchestra Registryn, Archive Policyn ja geneerisen Schema Workbench -UI:n.

Työpinnat:

`Project · Architecture · Code · Tasks · Tests · Runs · Review · Release · Documentation`

Tärkeät dokumentit:

- `MANCER_RUNTIME_1_18_0.md`
- `FULL_RELEASE_1_18_0.md`
- `ARCHIVE_CORE_1_17_1.md`
- `NANOMANCER_1_17_2.md`
- `ARKISTONHOITAJA_1_17_3.md`

Tarkistus:

```bash
npm install
npm run check
npm run build
```

Perusraja säilyy: agentti tai package ei saa itsenäisesti laajentaa toimivaltaansa, lukea toisen workspacen dataa, kirjoittaa julkista sisältöä tai tehdä releasea ilman nimenomaista sopimusta ja ihmisen hyväksyntää.
