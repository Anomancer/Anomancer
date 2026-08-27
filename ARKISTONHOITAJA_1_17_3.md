# Anomancer 1.17.3 · Arkistonhoitaja

## Tavoite

1.17.3 lisää Archive Coren päälle deterministisen **Archive Governance Agentin**. Arkistonhoitaja ei ole automaattinen LLM-muisti, eikä sillä ole oikeutta muuttaa Arkistoa. Se lukee serverin sisällä hallittua arkistodataa, muodostaa indeksin ja tuottaa ihmisen tarkistettavia ehdotuksia.

## Contract

`server/archive-curator.js` julkaisee `anomancer-archive-governance-agent/v1` -sopimuksen.

- modelAccess: `none`
- networkAccess: `none`
- sideEffects: `false`
- suggestionsOnly: `true`
- Archive Object write: denied
- Archive delete: denied
- grant expansion: denied
- evidence verification: denied
- publish: denied

Arkistonhoitajan raportti ei sisällä mutaatio-operaatiota. Jokainen proposal merkitään `mutationAllowed:false` ja `humanDecisionRequired:true`.

## Indeksointi

Jokainen tarkastus rakentaa versionoidun indeksin:

- objektit tyypeittäin
- työtiloittain
- projekteittain
- statuksittain
- yleisimmät tagit

Indeksi syntyy tarkastushetkellä serverissä. Se ei muuta Archive Storea.

## Archive Health

Tarkastus raportoi vähintään:

- integrity hash -poikkeamat
- puuttuvat relation-kohteet
- täsmäduplikaatit content hashin perusteella
- lähes-duplikaatit deterministisellä token-similariteetilla
- retention review -velan
- muistiverkosta irralliset objektit
- saman projektin puuttuvat relation-ehdotukset

Lähes-duplikaatti on seulontatulos, ei semanttinen totuus tai poistopäätös.

## UI

Arkisto-pinnassa on uusi `ARKISTONHOITAJA 1.17.3` -paneeli.

Käyttäjä voi:

1. ajaa koko Arkiston human-global tarkastuksen,
2. rajata tarkastuksen aktiiviseen työtilaan,
3. tarkistaa Archive Health -mittarit,
4. lukea ehdotukset,
5. tallentaa tarkastusraportin erillisellä human-approved Archive write -toiminnolla.

Raportin tallennus on käyttäjän oma toiminto. Tarkastus itsessään ei kirjoita mitään.

## Turvaraja

Arkistonhoitaja ei:

- poista duplikaattia,
- merkitse objektia historialliseksi,
- lisää relation-linkkiä,
- muuta retention-politiikkaa,
- myönnä toiselle työtilalle oikeuksia,
- muuta hyväksytyn objektin sisältöä,
- lähetä arkistosisältöä mallille tai verkkoon.

Sen tehtävä on tehdä muistikerroksen järjestysvelka näkyväksi.
