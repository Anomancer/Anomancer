# Anomancer Research + Data + Market Capability Expansion Pack v1

Tämä paketti laajentaa Capability Package Spec v1:n ensimmäiseksi käytännön kyvykkyyskirjastoksi.

## Periaate

Kyvykkyys kertoo mitä järjestelmä osaa. Malli, Mancer, orkesteri ja Tool Broker ovat erillisiä valintakerroksia.

```text
D0
→ ProblemModel
→ Capability Matching
→ Capability Packages
→ Capability Router
→ Hands / reasoning
→ trace
→ ihminen
```

## Lähdekerros

- source.search
- academic.search
- news.search
- source.rank
- source.crosscheck
- source.primary.find
- source.recency.check
- source.bias.inspect

`source.search`, `academic.search` ja `news.search` ovat read-only runtime-kykyjä. Ne käyttävät tässä versiossa olemassa olevaa Brave-hakuyhteyttä eri hakuprofiileilla.

## Tutkimuskerros

- research.synthesize
- research.gap.detect
- research.method.inspect

## Datakerros

- data.profile
- data.analyze
- data.compare
- data.anomaly.detect
- data.visualize
- timeseries.analyze
- statistics.describe
- statistics.uncertainty

`data.visualize` tuottaa v1:ssä visualisointisuunnitelman/specin, ei kuvaa. Varsinainen chart-renderer voidaan kytkeä myöhemmin omaksi runtime-adapteriksi.

## Markkinakerros

- market.snapshot
- market.sentiment
- market.volatility
- market.liquidity
- market.risk
- market.scenario

Markkinakyvyt eivät saa keksiä live-hintoja. Ne analysoivat vain käyttäjän aineistoa ja oikeasti runtime-haettuja lähteitä.

## Monimallikerros

- model.compare
- model.disagreement
- model.merge
- uncertainty.calibrate

Nämä paketit ovat tarkoituksella `disabled` v1:ssä. Nykyinen Model Router osaa käyttää useita provider-tyyppejä ja fallback-reittejä, mutta varsinainen rinnakkainen ensemble-executor rakennetaan erikseen. Kyvyt muuttuvat käyttökelpoisiksi vasta kun runtime pystyy todella tuottamaan usean mallin erilliset tulokset.

## Turvarajat

- lähdehaut ovat read-only
- reasoning-kyvyt eivät tee ulkoisia muutoksia
- source runtime käyttää vain jo hyväksyttyä hakupalveluyhteyttä
- model ensemble ei teeskentele olevansa käytössä ennen executorin valmistumista
- kaikki lähteet kulkevat Lighthouse Hands -jäljen läpi
- Human Authority säilyy ylimpänä toimivaltana
