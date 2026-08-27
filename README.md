# Anomancer 1.17.2 · Nanomancer

**1.17.2** jatkaa Mancer Runtime -sarjaa lisäämällä Coren ensimmäisen versionoidun Capability Plugin -kerroksen. Ensimmäinen plugin on Nanomancer: deterministinen, read-only analyysimikroskooppi Archive Objectien, Run Recordien ja rakenteisen JSON-datan vertailuun.

Nanomancer ei ole uusi työtila eikä uusi LLM-agentti. Sen contract kieltää mallikäytön, workspace-kirjoituksen ja Archive-kirjoituksen. Arkistoa luetaan vain aktiivisen työtilan omistuksen tai ihmisen eksplisiittisen grantin kautta, jolloin syntyy Context Receipt.

Analyysin mahdollinen tallennus Arkistoon tapahtuu erillisellä human-approved toiminnolla.

Tarkistus:

```bash
npm run check
```

Katso `NANOMANCER_1_17_2.md`, `ARCHIVE_CORE_1_17_1.md` ja `FULL_RELEASE_1_17_2.md`.
