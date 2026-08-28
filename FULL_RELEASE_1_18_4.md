# Anomancer 1.18.4 — P3 Capability Wiring & Operational Safety

Tämä full release sisältää koko 1.18.3 Hotfix 2 -pohjan ja lisää Codemancerille suljetun operation control plane -kerroksen.

Uusi kerros kattaa repository-write-, test runner-, pull request-, Vercel preview-, Vercel production- sekä repository- ja deployment-rollback-capabilityt. Jokaisessa niistä plan, hyväksyntä ja suoritus ovat erillisiä tapahtumia. Default-haaraa ei kirjoiteta, PR:ää ei automergata ja production käyttää liikkuvan haaran sijaan yhdistetyn PR:n tarkkaa merge-SHA:ta.

Operation Store on työtilakohtainen, optimistic revision -suojattu ja hash-ketjutettu. Production- ja rollback-workflow’t käyttävät GitHubin `production`-environmentia. Selain ei vastaanota palvelinsalaisuuksia eikä voi antaa adapterille komentomerkkijonoa.

Paikallinen ei-selaimellinen release-portti: **57/57 PASS**. P3:n kohdennetut portit: **14/14 PASS**. Yhdeksän Chromium-porttia ovat edelleen mukana pakollisessa CI-ketjussa.

Käyttöönotto ja turvarajat: `P3_CAPABILITY_WIRING_1_18_4.md`.

Validointi: `FINAL_VALIDATION_1_18_4.md`.
