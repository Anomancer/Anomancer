# Anomancer 16.0 · Core Product Shell

15.2 tekee julkisesta `/core`-näkymästä tuotteen rakennekartan ilman että yksityinen control plane avataan.

## Julkiset alueet

- Overview — Agent Contract, Orchestra Registry ja Run Receipt yhdessä näkymässä.
- Agent Pool — julkiset sopimustiedot, budjetit ja toimivaltarajat.
- Orchestras — julkinen built-in-topologia; yksityisessä Coressa 15.7 Custom Orchestra Builder, sequential/parallel-vaiheet ja server-side Orchestra Store.
- Runs — vain rakenteellinen demo; oikea run history pysyy `/admin`issa.
- Evidence — candidate → claim audit → human verify → publish gate.
- Models — 15.5:ssa LIVE ROUTER: loogiset reitit, tuetut provider-targetit ja fallback-topologia.
- Tools — 15.4:ssa palvelinpuolen Tool Broker + Policy Gate valvoo nykyistä oikeaa työkalupintaa fail-closed-periaatteella.
- Usage — sopimusbudjettien headroom; todelliset tokenit ja kustannukset ovat yksityisiä ja 15.9:ssa workspace-scopattuja.
- Workspaces — julkinen näyttää vain scope-arkkitehtuurin; yksityinen Core hallitsee Workspace Registryä.

## Turvaraja

`/core` käyttää vain buildissa tuotettua `core-public.json`-snapshotia. Se ei kutsu `/api/admin/*`-rajapintoja eikä sisällä run historya, raakaa promptia, raakaa mallivastausta, sessioita tai palvelinsalaisuuksia.

`/admin` pysyy varsinaisena yksityisenä control planena.

## 15.8 · Run Explorer

Yksityinen Core käyttää nyt server-side Run Storea. Runs ja Usage ovat oikeita yksityisen ohjaamon alueita; julkinen `/core` näyttää vain rakenteen eikä käyttödataa.

## 15.9 · Workspace Boundary

Julkinen `/core` kertoo mitkä kerrokset ovat yhteisiä ja mitkä workspace-kohtaisia, mutta se ei julkaise workspacejen nimiä, lukumääriä tai käyttödataa. Yksityinen `/admin` sisältää workspace-valitsimen ja Workspace Registryn.

## 16.0 · Kaksikielinen pintasopimus

Julkinen tuoterakenne on sama, mutta käyttöliittymä ei ole sekakielinen: `/core` on FI ja `/en/core` EN. Molemmat käyttävät samaa build-time Core-snapshotia ja eri näkyvää sanastoa. Yksityinen `/admin` on suomeksi. Teknisiä ID- ja enum-arvoja ei lokalisoida protokollakerroksessa.
