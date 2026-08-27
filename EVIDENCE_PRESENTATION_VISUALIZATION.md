# Anomancer 16.2 · Evidence Presentation + Visualization

## Periaate

Evidenssin totuuskerros ja sen julkinen esitystapa ovat eri asioita. Julkaisupaketti ei saa hyväksyä, vahvistaa tai keksiä evidenssiä. Se saa ehdottaa luonnollisen inline-sijoituksen vain jo ihmisen varmentamalle URL:lle, joka kuuluu `supported`-väitteeseen.

`citationMode`: `inline` · `sources` · `both`.

Inline-sijoitus tallentuu rakenteena `claimText + evidenceUrl + quote + anchorText`. Build lisää linkin deterministisesti vain, jos quote löytyy tekstistä yksikäsitteisesti ja anchorText on sen sisällä.

## Visualisointivahti

Visualisointivahti on valinnainen agentti eikä kuulu sisäänrakennetun toimitusorkesterin pakollisiin kahdeksaan vaiheeseen. Se ei tuota kuvaa. Se tuottaa `bar`/`line`-kaaviospeksin.

Jokainen datapiste tarvitsee:
- numeerisen arvon, joka esiintyy kirjaimellisesti `evidenceQuote`-katkelmassa
- varmennetun evidenssi-URL:n, joka kuuluu supported-väitteeseen
- täsmällisen tekstikatkelman luonnoksesta tai supported-väitteestä

Palvelin hylkää muun. Ihminen hyväksyy ehdotuksen editoriin. Julkinen build renderöi SVG:n deterministisesti ilman uutta mallikutsua.

## Auktoriteetti

`Julkaisupaketti`: citation placement propose, ei body.write, ei claims.write, ei source.verify, ei publish.

`Visualisointivahti`: visualization propose, ei body.write, ei claims.write, ei source.verify, ei publish.
