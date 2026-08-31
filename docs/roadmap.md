# Anomancer roadmap

Tämä tiedosto on päätöspinta, ei muutoshistoria. Julkaistut muutokset kirjataan `CHANGELOG.md`:hen.

## Nyt · 1.24 Lighthouse convergence

- Lighthouse on yksityisen järjestelmän kanoninen sovelluskuori.
- `/lighthouse` = Kevyt tila, `/lighthouse/workbench` = Työpöytä, `/lighthouse/login` = kirjautuminen.
- Anomancer on toimitus- ja julkaisumancer, ei koko yksityisen sovelluksen nimi.
- Vanha Lähetyskone/Toimituskone säilyy vain sisäisenä yhteensopivuuskerroksena migraation ajan.
- Lighthouse → Mancer → Orkesteri → Agentti → Kyvykkyys on käyttäjälle näkyvä käsitemalli.
- Vercel-direct on kehitys- ja tuotantopolku: `npm run check` → `vercel --prod`.

## Seuraavaksi · 1.24.x

- Pura Anomancerin nykyinen toimituseditori asteittain natiiveiksi Lighthouse Workbench -moduuleiksi ilman kertarysäyksen rewritea.
- Erota toimitustyö julkaisukohteesta Publishing Target -adapterilla. Nykyinen anomancer.com on ensimmäinen target, ei pysyvä oletusarkkitehtuuri.
- Yhtenäistä Kevyen tilan ja Työpöydän työ-/run-konteksti, jotta työ voidaan avata syvempään näkymään ilman kontekstin häviämistä.
- Viimeistele Mancer-valinta, työtilakohtainen navigaatio ja Mancer Package -sopimus niin, että uusi Mancer ei vaadi Lighthouse-shellin kovakoodausta.

## Sen jälkeen

- 1.25–1.30 — Orchestra Registry V2, Context Gateway, Archive Graph, monimalliajo, Tool Sandbox ja hallittu itsekehityssilmukka.
- Uudet Mancerit lisätään vasta Lighthouse-rungon päälle: Auditomancer, Datamancer, Stylemancer, Teachmancer, Ecomancer, Cybomancer ja muut domain-paketit.
- 1.31–1.35 — Mancerien väliset hyväksytyt artefaktit, yleishaku, observability, policy inspector sekä export/restore.
- 1.4x — henkilökohtaisen järjestelmän pitkä stressitesti.
- 2.0? — monen käyttäjän Core vasta tenant-eristyksen, roolien, secret/budget-eristyksen, auditoinnin ja palautusrajojen jälkeen.

## Päätösperiaatteet

1. Lighthouse on kuori, ei Mancer.
2. Mancer rajaa tehtäväkentän ja työtilan, ei ohita Coren turvallisuusrajoja.
3. Kyvykkyys ei ole lupa eikä toimivalta.
4. Agentti voi ehdottaa; ihminen hyväksyy pysyvät tai ulkoiset vaikutukset.
5. Orkesteri on jäljitettävä työnkulku, ei maaginen agenttiparvi.
6. Julkaisukanava on adapteri, ei toimitustyön sisään kovakoodattu kohde.
7. Uusi vaihe alkaa vasta, kun edellisen vaiheen release gate on vihreä.
