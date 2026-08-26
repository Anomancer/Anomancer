# Anomancer 14.1 · Orchestrator + Live Terminal

14.1 tekee Lähetyskoneen seitsemästä agentista yhden hallitun toimitusputken:

`Lähdeagentti → Väitevahti → Rakenneagentti → Kirjoitusagentti → Kriitikko → Äänieditori → Julkaisupaketti`

## Authority

Orkestrointi tapahtuu selaimessa vaihe vaiheelta olemassa olevan `/api/admin/agents`-rajapinnan kautta. Välitulokset elävät ajon työmuistissa. Orkesteri ei kutsu GitHub-writeä, luonnoksen tallennusta tai julkaisua.

Lopuksi käyttäjä voi erillisellä painikkeella siirtää lopputuloksen editoriin. Tämäkään ei tallenna tai julkaise. Tallennus ja julkaisu pysyvät adminin erillisinä ihmisohjattuina toimintoina.

## Live terminal

Pieni terminaali näyttää jokaisen vaiheen käynnistymisen, valmistumisen, mallin, mahdolliset tokenluvut, keston ja virheen. Ajon voi pysäyttää selaimesta. Abort ei takaa jo käynnistyneen serverless-kutsun laskennan välitöntä peruuntumista, mutta pysäytetty ajo ei jatka seuraaviin vaiheisiin eikä sovella tulosta editoriin.

## Provisional evidence

Lähdeagentin automaattisesti löytämät lähteet kulkevat orkesterin työmuistissa provisioina. Ne eivät muutu ihmisen varmistamiksi lähteiksi vain siksi, että myöhempi agentti näkee ne. Lopputuloksen editoriin siirtäminen muistuttaa tästä erikseen.
