# Anomancer 1.18.5 R1 · UI flow repair

Korjauspaketti senior UI/UX -katselmuksen löydöksiin.

- Orkesterin vaiheruudukon 8-vaiheinen erikoistapaus poistettu.
- Snake-flow lasketaan nyt dynaamisesti mille tahansa askelmäärälle: 4 saraketta desktopilla, 2 keskikoossa, 1 mobiilissa.
- Mobiilin timeline-raita ja askelpisteet koskevat kaikkia orkestereita.
- `--color-focus-border` nostettu arvosta `#963049` arvoon `#b4425e`, jotta fokusraja ylittää 3:1 kontrastin tummilla pinnoilla.
- Root/public runtime-peilit pidetään identtisinä.
- Uusi regressiotesti `scripts/test-ui-flow-repair-1185.mjs` vartioi korjausta.
