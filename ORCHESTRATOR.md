# Anomancer 14.2.1 · Orchestrator

Orkesteri ajaa seitsemän vaihetta järjestyksessä: source, structure, writer, critic, voice, claims ja package. Kaikki tulokset ovat ehdotuksia. Vain ihminen voi siirtää lopputuloksen editoriin, tallentaa luonnoksen tai julkaista.

## Luonnosidentiteetti

Ajon alussa checkpointiin tallennetaan artikkelin GitHub-polku, SHA, otsikko ja editorisisällön sormenjälki. Tallentamattomalle uudelle luonnokselle luodaan lisäksi välilehtikohtainen instance-ID, jotta kahta path/sha-arvoltaan tyhjää luonnosta ei voi sekoittaa keskenään. Jatkaminen ja lopputuloksen soveltaminen estetään, jos avoinna on eri artikkeli. Jos samaa artikkelia on muutettu ajon jälkeen, käyttöliittymä näyttää konfliktivaroituksen ennen korvaavaa soveltamista.

Checkpoint tallennetaan vain selaimen `sessionStorage`-tilaan. Tallennusvirhe näytetään käyttäjälle. Myös valmis tulos säilyy sivun uudelleenlatauksen yli.

## Virheet, retry ja pysäytys

Palvelin luokittelee DeepSeek-virheet pysyviin ja tilapäisiin. Vain tilapäinen virhe saa yhden automaattisen retry-yrityksen. Odotus käyttää eksponentiaalista backoffia, jitteriä ja tarvittaessa palvelimen `Retry-After`-arvoa.

Pysäytys abortoi selaimen pyynnön ja välittää peruutussignaalin palvelimen DeepSeek-kutsuun. Viimeinen valmis vaihe säilyy checkpointissa. Sisältösuodattimen pysäyttämää lähdehakua ei retrytetä automaattisesti.

## Evidenssin käsittely

Lähdeagentin ehdotukset säilyttävät kentät `why`, `supports`, `challenges`, `origin`, `verification` ja `retrievedAt`. Niitä ei muuteta automaattisesti tarkistetuiksi. Väitevahti ajaa 14.2.1:ssä vasta kirjoitus-, kritiikki- ja äänivaiheiden jälkeen, joten se auditoi lopullista proosaa eikä vanhaa lähtötekstiä. Se saa käyttää `supported`-tilaa vain tarkistetun lähteen kanssa. Candidate-URL voidaan säilyttää `open`/`interpretation`-väitteen provisionaalisena tutkimusjälkenä. Paketoija ei saa kirjoittaa claims/sources-kenttiä uusiksi; palvelin kuljettaa Evidence Layerin viimeiseen vaiheeseen kanonisena.

