# Anomancer 15.1 · Core Foundation

15.0 erottaa ensimmäistä kertaa agentin identiteetin, orkesterin rakenteen ja ajon todistettavan metadatan varsinaisista prompteista.

## Agent Registry

`api/_lib/core-registry.js` on palvelimen kanoninen rekisteri. Jokaisella agentilla on `anomancer-agent/v1` -sopimus, jossa ovat vähintään:

- `id`, `label`, `version`, `role`, `description`
- `modelRoute`
- `tools` ja `capabilities`
- `authority.read`, `authority.write`, `authority.deny`
- `budget.maxOutputTokens`, timeout ja mahdollinen ceiling
- `humanApproval`
- deterministinen SHA-256 `contractHash`

Prompti ei siis yksin määritä agentin roolia. Sopimus kertoo myös mitä agentti saa kirjoittaa ja mitä se ei saa tehdä.

## Orchestra Registry

`editorial/1.0.0` on ensimmäinen Core-orkesteri:

`source → structure → writer → critic → audience → voice → claims → package`

Orkesterilla on oma `orchestraHash`, human-final-authority ja evidenssipolitiikka. Selain voi käyttää fallback-järjestystä ennen kuin yksityinen Core API on latautunut, mutta onnistuneen autentikoinnin jälkeen rekisteri on orkesterin kanoninen kuvaus.

## Run Receipt

Jokainen onnistunut `/api/admin/agents`-ajo tuottaa `anomancer-run-receipt/v1` -kuitin. Kuitti sisältää:

- agentin version ja `contractHash`in
- mallin ja model routen
- `orchestraRunId` + `stageIndex`, jos ajo kuului orkesteriin
- input/output-tokenit, reasoning-tokenit ja output-budjetin
- käytetyt työkalut
- input- ja output-SHA-256-hashit
- ajat, keston ja human-approval -tilan

Kuitti ei sisällä raakaa promptia, artikkelia tai agentin raakavastausta.

## Run Ledger

`admin-core.js` säilyttää selaimessa ajokuitit `localStorage`-ledgerissä. Jokainen ledger-entry sisältää edellisen entryn hashin ja oman SHA-256-hashin. Core tarkistaa ketjun avatessaan näkymän.

Tämä on auditointia helpottava paikallinen eheysketju, ei vielä kryptografisesti allekirjoitettu ulkoinen todiste. Käyttäjä, jolla on pääsy selaimen storageen, voi muuttaa dataa. Myöhempi Core-versio voi siirtää ledgerin palvelinpuolelle ja allekirjoittaa kuitit.

## Core-reitti

Julkisen Anomancerin aiempi Observatory-portti osoittaa nyt `/core`-reittiin. Vercel reitittää sen yksityiseen `/admin`-konehuoneeseen, ja `/core` käyttää samoja `no-store`, `noindex` ja CSP-suojauksia kuin admin-reitti. `/admin` säilyy teknisenä taustareittinä.

## Rajattu 15.0-scope

15.0 ei vielä tuo:

- Tool Brokeria
- custom agent -editoria
- usean providerin Model Routeria
- työtiloja / käyttäjäorganisaatioita
- kuukausimaksua tai quota-billingiä
- allekirjoitettuja run receiptejä

Näille on kuitenkin nyt paikka ilman, että Lähetyskoneen nykyinen toimituksellinen turvamalli tarvitsee repiä auki.


## 15.1 · Public Core Showcase

`/core` on julkinen, turvallisesti redaktoitu näkymä Coren rakenteeseen. Se ei käytä admin-API:a. Julkinen snapshot syntyy buildissa Agent Registrystä ja sisältää vain roolin, kuvauksen, mallireitin, tokenbudjetin, kirjoitusoikeuksien nimet, sopimushashin sekä orkesterin julkisen rakenteen. Oikeat ajokuitit, työmuisti, sessiot ja palvelinsalaisuudet jäävät `/admin`-ohjaamoon.
