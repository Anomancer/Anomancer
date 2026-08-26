# Anomancer 15.2 · Core Product Shell

15.2 tekee julkisesta `/core`-näkymästä tuotteen rakennekartan ilman että yksityinen control plane avataan.

## Julkiset alueet

- Overview — Agent Contract, Orchestra Registry ja Run Receipt yhdessä näkymässä.
- Agent Pool — julkiset sopimustiedot, budjetit ja toimivaltarajat.
- Orchestras — rekisteröityjen orkestereiden vaihejärjestys ja politiikat.
- Runs — vain rakenteellinen demo; oikea run history pysyy `/admin`issa.
- Evidence — candidate → claim audit → human verify → publish gate.
- Models — nykyiset loogiset model route -ryhmät; multi-provider router ei vielä ole valmis.
- Tools — sopimuksiin liitetty työkalupinta; Tool Broker on seuraava runtime-kerros.
- Usage — sopimusbudjettien headroom; todelliset tokenit ja kustannukset ovat yksityisiä.

## Turvaraja

`/core` käyttää vain buildissa tuotettua `core-public.json`-snapshotia. Se ei kutsu `/api/admin/*`-rajapintoja eikä sisällä run historya, raakaa promptia, raakaa mallivastausta, sessioita tai palvelinsalaisuuksia.

`/admin` pysyy varsinaisena yksityisenä control planena.
