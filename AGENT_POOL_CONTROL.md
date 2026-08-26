# Anomancer 15.3 · Agent Pool Control

15.3 tekee yksityisen `/admin`-Coren Agent Poolista oikean runtime-ohjauspinnan.

## Immutable Agent Contract

Agentin sopimus pysyy hashattuna ja muuttumattomana ajon aikana. Mallireitti, työkalut, capabilityt, luku- ja kirjoitusoikeudet, kiellot sekä human gate -rajat eivät ole Runtime Profilen muokattavissa.

## Runtime Profile

Admin voi agenttikortista:

- kytkeä agentin ACTIVE / OFF
- säätää output-tokenkattoa sopimuksen sallimassa haarukassa
- palauttaa runtime-asetukset sopimuksen oletuksiin

Runtime Profile tallentuu tällä versiolla vain admin-selaimen `localStorage`en. Orkesteriajon alussa profiilit jäädytetään checkpointiin, joten kesken ajon tehty muutos ei muuta jo käynnissä olevan orkesterin sääntöjä.

## Server-side clamp

Client ei päätä lopullista tokenkattoa. `/api/admin/agents` normalisoi Runtime Profilen Agent Contractia vasten. OFF-agentti palauttaa `AGENT_DISABLED`, ja tokenkatto clampataan sopimuksen minimi- ja maksimirajoihin. Runtime Profile ei voi lisätä työkaluja tai toimivaltaa.

## Orkesteri

OFF-agentti ohitetaan näkyvästi tilassa `disabled`. Human approval gate säilyy erillisenä. Run Receipt tallentaa käytetyn runtime-tokenkaton mutta ei raakaa promptia tai raakaa outputia.

15.4 lisäsi Tool Brokerin ja 15.5 `modelTarget`-reitityksen. 15.6 siirtää nämä Runtime Profilet serverin pysyvään storeen. Selain toimii hallintakonsolina, mutta serveri on auktoriteetti ja orkesteri käyttää allekirjoitettua snapshotia.
