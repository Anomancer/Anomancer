# Core Shell Semantics 16.8

## Päätös

Anomancer Core on yksityinen monityötilainen käyttöjärjestelmäkerros. Lähetyskone on sen Anomancer-työtilaan kuuluva toimituksellinen editori, ei koko sovelluksen nimi tai globaali navigaatiomalli.

## Navigaatiotasot

### Globaali Core Shell

- Työtilat
- Nykyinen työ
- Konehuone
- Asetukset

Globaali reitti ei vaihda työtilaa sivuvaikutuksena. Valittu työtila vaihtuu vain työtilakortista tai työtilavalitsimesta käyttäjän nimenomaisella toiminnolla.

### Anomancer-työtila

- Lähetykset
- Kirjoita
- Evidenssi
- Agentit
- Orkesteriajo
- Julkaisu
- Aineisto & ulostulo

Rakenne tulee `Workspace Template` -metadatasta. Lähetykset avaa paikallisen kirjaston, Orkesteriajo kohdistaa toimitusputkeen ja Aineisto & ulostulo näyttää valitun työtilan adapteri- ja Constitution-rajan.

### Narramancer

Narramancer säilyttää oman metadataohjatun paikallisnavigaationsa ja eristetyn private Artifact Storen. Core Shell ei lisää siihen Anomancerin Lähetyksiä tai julkaisutoimintoja.

### Tyhjä eristetty työtila

Tyhjä työtila näyttää oman kotinäkymän, jossa editorin puuttuminen on eksplisiittinen turvallinen tila. Näkymä kertoo perustuslain, aineistosäilön ja sitomattoman ulostulon sekä tarjoaa reitit Konehuoneeseen, aineistorajaan ja työtilan vaihtoon.

## Julkaisutiedot

Versio ei kilpaile työtehtävän kanssa headerissa, kirjautumisnäkymässä tai Konehuoneen työpinnalla. Julkaisu- ja Core-versio löytyvät Asetukset → Järjestelmätiedot.

## Säilyvät rajat

- yksityinen reitti ja PWA-scope `/lahetyskone`
- agentti-, työkalu- ja orkesterisopimukset
- Workspace Template + Constitution -malli
- Artifact Boundary ja työtilojen eristys
- ihmisen lopullinen tallennus- ja julkaisupäätös
- 16.7:n selainavainten migraatio 16.8-avaimiin

## Hyväksyntä

`npm run test:core-shell-semantics` tarkistaa shellin globaalit reitit, Anomancerin paikalliset työkalut, tyhjän työtilan kotinäkymän, aineistorajan, version metadatasijainnin, selaintilan migraation ja PWA-cacheversion.
