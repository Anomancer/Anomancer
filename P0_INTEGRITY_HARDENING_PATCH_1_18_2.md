# Anomancer 1.18.2 — P0 Integrity Hardening Patch

Tämä patch toteuttaa Senior Lead UI/UX -auditin ensimmäisen korjausportin. Sen tavoite on estää paikallisen työn hiljainen katoaminen ja vanhan työtilakontekstin vuotaminen uuteen näkymään.

## Korjatut julkaisunestävät polut

### Yhteinen tallentamattomien muutosten sopimus

Lähetyskone, Romancer ja geneerinen Mancer-renderer rekisteröivät dirty-tilansa samaan client-side-rekisteriin. Sama rekisteri vartioi nyt:

- selaimen välilehden sulkemista ja uudelleenlatausta;
- uloskirjautumista;
- työtilan vaihtamista;
- nykyisen editorikohteen vaihtamista.

Uudet työtilatyypit voidaan liittää vartijaan ilman uuden kovakoodatun ehtolauseen lisäämistä.

### Revision conflict ilman paikallisen työn menetystä

Mancer- ja Romancer-tallennus eivät enää lataa konfliktissa palvelinversiota suoraan editorin päälle. Paikallinen snapshot säilyy muistissa ja käyttöliittymä näyttää eksplisiittisen konfliktipalkin.

Ihminen voi:

1. ladata paikallisen ja palvelinversion samaan JSON-turvakopioon;
2. ottaa palvelinversion käyttöön erillisen vahvistuksen jälkeen;
3. säilyttää paikallisen version uusimman palvelinrevision päällä erillisen vahvistuksen jälkeen.

Jos palvelinversiota ei saada konfliktin jälkeen ladattua, korvaavat valinnat piilotetaan. Tällöin käyttöliittymä tarjoaa vain paikallisen turvakopion eikä teeskentele tuntevansa uusinta revisiota.

### Workspace request boundary

Mancerin, Romancerin, Nanomancerin ja Lähetyskoneen lataukset sidotaan nyt neljään ehtoon:

- pyynnön alussa kaapattu workspace-id;
- workspace epoch;
- moduulikohtainen request-id;
- `AbortController`-signaali.

Vastaus saa muuttaa käyttöliittymätilaa vain, jos kaikki ehdot ovat edelleen nykyisiä. Työtilan vaihto peruu vanhan pyynnön ja vanha vastaus hylätään myös silloin, jos peruminen ehti liian myöhään.

### Tallennuksen aikaiset paikalliset muutokset

Mancer ja Romancer lähettävät palvelimelle erillisen snapshotin. Jos käyttäjä ehtii muuttaa editoria ennen vastauksen valmistumista, palvelimen vastaus päivittää revision ja baselinen mutta ei korvaa uudempaa paikallista projektia. Uudempi työ jää näkyvästi tallentamattomaksi.

Lähetyskone lukitsee editorikontrollit oman tallennuksensa ajaksi ja estää työtilavaihdon aktiivisen tallennuksen aikana.

### Nanomancer

Työtilan vaihto:

- tyhjentää vanhan analyysituloksen näkyvästä DOMista;
- tyhjentää vanhan capability- ja lähdedatan;
- peruu vanhan latauksen tai analyysiajon;
- estää vanhan analyysin arkistoinnin uuden työtilan tunnuksella.

## Regressioportti

Uusi `scripts/test-p0-integrity-1182.mjs` tarkistaa dirty-rekisterin, konfliktien säilyttävät polut, request boundaryn, Nanomancerin tyhjennyksen sekä juuri- ja `public/`-lähteiden identtisyyden.

Selainbinääriä vaativat olemassa olevat seitsemän visual/UI-testiä pysyvät erillisenä ympäristövaatimuksena. Patch ei poista tarvetta provisionoida Chromiumia täyteen `npm run check` -ajoon.
