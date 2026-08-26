# Anomancer 14.2 · UI/UX- ja agenttiorkesteriauditointi

## Lopputulos

14.2 korjaa julkaisukoneen kriittisimmän luottamusongelman: koneen löytämä URL ei enää muutu huomaamatta ihmisen hyväksymäksi evidenssiksi. Admin tukee nyt selkeää toimitusketjua kirjoittamisesta evidenssin tarkistukseen, agenttityöhön ja erilliseen julkaisuporttiin.

## Korjatut P0-ongelmat

| Alue | Aiempi riski | 14.2-ratkaisu |
| --- | --- | --- |
| Yleisösuodatus | Build rikkoi whitespace-regexin ja monen yleisön suodatus epäonnistui. | Logiikka siirrettiin ulkoiseen `site.js`-moduuliin ja sille lisättiin regressiotesti. |
| Evidenssi | Agentin `why`, `supports` ja `challenges` katosivat, ja URL-jäsenyys riitti tuetulle väitteelle. | Provenance säilyy koko putken läpi; `supported` vaatii ihmisen tarkistaman lähteen. |
| Julkaisuvalta | Agenttilähde saattoi näyttää käytännössä hyväksytyltä. | Source Agentin lähde pakotetaan aina `candidate`-tilaan. Vain ihminen voi vaihtaa sen `verified`-tilaan. |
| Checkpoint | Orkesteritulos voitiin jatkaa tai soveltaa väärään artikkeliin. | Checkpoint sidotaan path-, SHA- ja fingerprint-identiteettiin. Ristiriita estetään tai varoitetaan näkyvästi. |
| Ylikirjoitus | Editorin muutokset saattoivat kadota orkesteriajon aikana. | Editorin kirjoituskentät lukitaan ajon ajaksi ja myöhemmistä muutoksista näytetään konfliktivaroitus. |
| Agenttisopimukset | Muut kuin lähdeagentti luottivat vapaamuotoiseen JSONiin. | Kaikkien seitsemän roolin tulokset validoidaan ja normalisoidaan palvelimella. |
| Retryt | Pysyvä DeepSeek-virhe saattoi näyttää tilapäiseltä 502-virheeltä. | Virheellä on eksplisiittinen `retryable`-luokka; retry käyttää backoffia, jitteriä ja `Retry-After`-arvoa. |
| Pysäytys | Selain keskeytti odotuksen, mutta upstream-kutsu saattoi jatkua. | Abort-signaali välitetään selaimesta palvelimelle ja DeepSeek-fetchiin asti. |

## Korjatut käyttöliittymä- ja sisältöongelmat

- Tekstieditori on adminin oletustyötila; Evidenssi ja Agentit ovat erillisiä välilehtiä.
- Lähteet näkyvät tarkistettavina kortteina, eivät vain vaikealukuisena putkitekstinä.
- Agenttituloksilla on semanttinen yhteenvetonäkymä ja erikseen avattava raaka JSON.
- Tallentamattomista muutoksista varoitetaan artikkelia vaihdettaessa, uutta aloitettaessa, poistuttaessa ja sivua suljettaessa.
- Tallennus-, julkaisu- ja poistopyynnöt lukitsevat toimintopainikkeet tuplalähetyksen ajaksi.
- Luonnos saa olla keskeneräinen, mutta julkaisu vaatii kuvauksen, alt-tekstin sekä valmiin evidenssin.
- Slugin vaihto säilyttää vanhan osoitteen staattisena canonical-uudelleenohjauksena.
- Mobiilissa artikkelilista toimii avattavana sivupaneelina.
- Julkisten listojen otsikkohierarkia, skip-linkit, fokusindikaattorit, suodattimien `aria-pressed` ja valikon ARIA-tila korjattiin.
- Etusivun raskaat JPG-kuvat saivat noin 55–83 kilotavun WebP-versiot sekä eksplisiittiset mitat ja lazy-loadingin.
- Pitkä esittelyteksti näyttää ydinkappaleet ensin ja muun taustan avattavana kokonaisuutena.

## Tekninen varmistus

Koko tarkistusketju kattaa adminin autentikoinnin ja CSRF:n, yhteydenottolomakkeen, julkisen UI:n, agenttisopimukset, buildin, entity- ja evidence-rakenteet, discovery-politiikan, DeepSeek-adapterin, orkesterin, domain-migraation ja SEO-smoketestit. Lopullinen ajo läpäisi 96 tarkistusta. ZIP tarkistettiin `unzip -t`-testillä.

## Seuraava tuotantovaihe

Nämä eivät ole paikallisen koodin avoimia P0-virheitä, vaan oikeaa ympäristöä vaativia hyväksyntätehtäviä:

1. Aja visuaalinen desktop- ja mobiilikatselmointi oikealla Chromiumilla vähintään etusivulle, lähetyslistalle, artikkeliin ja autentikoituun adminiin.
2. Aja stagingissa yksi täysi DeepSeek-orkesteri: normaali ajo, 429-retry, pysäytys, reload-palautus ja soveltaminen.
3. Testaa GitHub-konflikti kahdella selaimella, jotta vanha SHA tuottaa hallitun 409-tilan eikä hiljaista ylikirjoitusta.
4. Testaa Vercelissä vanhan slug-aliasin toiminta. Jos tarvitaan aidot HTTP 308 -vastaukset meta-refreshin sijaan, generoi aliasit deploy-konfiguraation redirecteiksi.
5. Lisää lähteiden linkkirotan seuranta ja tarvittaessa sallittu sisältösnapshot, jos evidenssin pitkäaikainen toistettavuus on tuotteen tavoite.
6. Lisää tuotannon Web Vitals-, agenttivirhe- ja julkaisuporttimittarit ilman luonnostekstin tai henkilötietojen vuotamista telemetriaan.
7. Tee 3–5 aidon toimitustyön käyttäjätestiä ja mittaa aika luonnoksesta tarkistettuun julkaisuun, virheiden määrä sekä kohtien ymmärrettävyys.

## Hyväksymiskriteeri huipputasolle

Kokonaisuus voidaan merkitä tuotantotasolla valmiiksi, kun stagingin selain- ja integraatiotestit ovat vihreät, yksikään agenttiehdokas ei voi ohittaa ihmisen evidenssiporttia, vanha sisältöosoite säilyy slug-muutoksessa ja toimituskäyttäjä pystyy julkaisemaan tekstin ilman raakadatakenttien käsittelyä.
