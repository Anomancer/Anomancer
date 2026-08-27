# Anomancer 16.4.0 · Lähetyskone App Split

Täysi 16.4.0-julkaisu rakentuu 16.3.5:n evidenssi-, editorial-, mobiili-, orkestrointi- ja turvallisuuskerrosten päälle.

Uusi versio lisää:

- asennettavan `/lahetyskone`-PWA:n työpöydälle ja mobiiliin
- sovellusmanifestin, rajatun service workerin ja 192/512-kuvakkeet
- sovelluksen sisäisen asennusohjauksen ja verkkoyhteyden tilan
- `/admin` → `/lahetyskone` -yhteensopivuusohjauksen
- julkisen Coren ja yksityisen Konehuoneen semanttisen erottelun
- `Julkaise eetteriin` -ihmisportin nykyisen GitHub/Vercel-putken päälle
- App Split -regressiotestin, joka valvoo scopea, välimuistirajaa, reittejä ja turvallisuussemantiikkaa

Mitään API-avainta, sessiota, artikkelia, luonnosta tai agenttitulosta ei viedä PWA-välimuistiin. Agentit eivät edelleenkään voi tallentaa tai julkaista.
