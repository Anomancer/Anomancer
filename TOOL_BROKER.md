# Anomancer 15.4 · Tool Broker + Policy Gate

15.4 siirtää työkaluluvan promptista palvelinpuolen valvontaan.

## Tool Registry

`api/_lib/core-registry.js` sisältää kanonisen Tool Registryn. Jokaisella työkalulla on:

- tunniste, versio ja SHA-256 `toolHash`
- tyyppi ja riskitaso
- mahdollinen vaadittu capability
- actor-raja (`agent` tai `human`)
- human-approval- ja side-effect-merkinnät

Ensimmäinen oikea agentin käyttämä ulkoinen työkalu on `web.search`. Lisäksi rekisteri kuvaa human-only-rajoina `source.verify`, `publication.publish` ja `github.write`.

## Policy Gate

`api/_lib/tool-broker.js` arvioi pyynnön fail-closed-järjestyksessä:

1. tunnettu agentti
2. tunnettu työkalu
3. actor-raja
4. työkalu löytyy Agent Contractista
5. vaadittu capability löytyy
6. authority-deny ei estä toimintoa
7. mahdollinen human gate

Mahdolliset tulokset ovat `allow`, `deny` ja `human_required`.

Tuntematon tai sopimukseen kuulumaton työkalu tuottaa `TOOL403`. Human-only-toiminto tuottaa `TOOL_HUMAN_APPROVAL_REQUIRED`, jos sitä yritetään agentin kautta.

## Oikea enforcement

Source Agentin `web.search` ei käynnisty ennen kuin Tool Broker on palauttanut `allow`. Client ei lähetä päätettävää työkalulistaa palvelimelle, vaan palvelin ottaa Tool Surfacen suoraan Agent Contractista. Näin selaimesta lähetetty ylimääräinen `toolRequests`-kenttä ei voi kasvattaa agentin oikeuksia.

## Policy Log

Onnistuneen työkalupyynnön policy-päätös tallentuu Run Receiptiin. Estetty policy-päätös voidaan näyttää yksityisen Coren paikallisessa Policy Logissa. Päätös sisältää vain metatietoa: agentti, työkalu, outcome, reason, riskitaso, aika ja ajokonteksti. Raakapromptia tai työkalun raakadataa ei tallenneta policy-lokiin.

## Julkinen / yksityinen

`/core` näyttää redaktoidun Tool Registryn ja brokerin toimintaperiaatteen. Oikea Policy Log ja runtime-control pysyvät `/admin`-puolella.

15.4 ei vielä tee yleistä plugin-/tool-executor-markkinapaikkaa. Broker suojaa nykyistä oikeaa `web.search`-polkua ja muodostaa kiinnityspisteen tuleville työkaluille.

## 15.5 Model Router -suhde

Model Router voi vaihtaa provider-targetin, mutta Tool Broker tekee työkalupäätöksen edelleen Agent Contractin perusteella. Providerin vaihtuminen ei anna agentille uusia työkaluja tai capabilityja.
