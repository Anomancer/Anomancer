# Anomancer 15.8 · Run Explorer + Usage Metering

15.8 tekee ajohistoriasta serverin hallitseman osan Corea. Yksittäinen agenttikutsu tuottaa edelleen `anomancer-run-receipt/v1`-kuitin, mutta orkesteriajon kuitit kootaan nyt samaan `anomancer-run-record/v1`-tietueeseen `orchestraRunId`:n alle.

## Mitä tallennetaan

Run Record säilyttää vain auditoitavaa metadataa:

- orchestraRunId, Orchestra Contractin id/nimi/hash
- status: running / checkpoint / stopped / completed / degraded / failed / aborted
- agentin id, role ja contractHash
- stageIndex
- provider, malli, model route ja model target
- fallback-tieto ja reititysyritysten metatiedot
- Runtime Profilen käytetty tokenkatto
- input/output/total/reasoning-tokenit
- työkalujen allow/deny/human_required-päätökset
- kesto
- inputHash ja outputHash
- runHash + previousRunHash
- editoriin soveltamisen human-status (`editor_applied`)

Run Store ei tallenna raakaa promptia, artikkelitekstiä, raakaa agenttioutputia, reasoning-sisältöä tai API-avaimia.

## Pysyvä tallennus

Oletuksena sama yksityisen GitHub-repon palvelinyhteys, jota Core jo käyttää, luo erillisen tag-refin:

`refs/tags/anomancer-run-state`

ja tallentaa kompaktin historian polkuun:

`.anomancer/run-history.json`

Tämä ei kirjoita `master`-haaraan eikä tee sisältödeployta. Viimeiset 60 Run Recordia pidetään selattavana historiana. Lifetime-kertymät säilyttävät aggregoidut run/token/provider/agent/orchestra-mittarit myös historian kierrätyksen yli.

Testi- ja paikalliskäyttöön `ANOMANCER_RUN_STORE=memory` käyttää muistivarastoa.

## Run Explorer

Yksityisessä `/admin → Core` -näkymässä voi nyt:

- suodattaa ajoja statuksen mukaan
- suodattaa agentin mukaan
- suodattaa providerin mukaan
- suodattaa orkesterin mukaan
- avata yhden Run Recordin
- nähdä stage-aikajanan
- nähdä stage-kohtaiset tokenit, mallin, keston, fallbackit ja policy-havainnot
- tarkistaa run chainin tilan
- kopioida replay-metadatan myöhempää vertailua varten

15.8 ei vielä käynnistä automaattista replay-ajoa.

## Usage Metering

Run Store laskee serverillä:

- runit
- input/output/total/reasoning-tokenit
- provider-kohtaiset tokenit
- agenttikohtaiset tokenit
- orkesterikohtaiset run-määrät
- fallbackit
- tool allow / deny / human_required -määrät
- kokonaiskeston

Explorer näyttää recent- ja lifetime-kertymät. Julkinen `/core` ei saa oikeaa käyttödataa.

## Kustannusarvio

Core ei arvaa provider-hintoja. Kustannus näkyy vain, jos palvelimelle annetaan eksplisiittinen EUR-hinta per miljoona tokenia.

Esimerkiksi DeepSeek:

`ANOMANCER_COST_DEEPSEEK_INPUT_EUR_PER_M`

`ANOMANCER_COST_DEEPSEEK_OUTPUT_EUR_PER_M`

Vastaavat provider-id:t toimivat myös OpenAI-, Anthropic- ja Gemini-targeteille:

`ANOMANCER_COST_OPENAI_INPUT_EUR_PER_M`
`ANOMANCER_COST_OPENAI_OUTPUT_EUR_PER_M`
`ANOMANCER_COST_ANTHROPIC_INPUT_EUR_PER_M`
`ANOMANCER_COST_ANTHROPIC_OUTPUT_EUR_PER_M`
`ANOMANCER_COST_GEMINI_INPUT_EUR_PER_M`
`ANOMANCER_COST_GEMINI_OUTPUT_EUR_PER_M`

Jos kummatkin kertoimet eivät ole määritelty, kustannus on `null` / käyttöliittymässä `—`. Historiallisen kuitin kustannusarvio jää siihen hintasnapshotiin, jolla kuitti tallennettiin.

## Hash-ketju

Lopullinen completed/degraded/failed/aborted Run Record saa:

- `previousRunHash`
- `runHash`

Hash ei riipu myöhemmin muuttuvista hintakertoimista. Se sitoo ajon Orchestra Contractiin, statukseen, aikaan, receipt-id:ihin, receipt-output-hasheihin ja käyttömetriikkaan. Recoverable checkpoint ei saa lopullista hashia ennen kuin ajo todella päätetään.

## Human authority

`editor_applied` tarkoittaa vain, että ihminen siirsi orkesterin tuloksen editoriin. Se ei tarkoita julkaisua eikä lähteiden hyväksyntää. Julkaiseminen säilyy erillisenä admin-toimintona ja Evidence Layerin human gate pysyy voimassa.

## Scope 15.8

15.8 on auditointi- ja mittauskerros, ei laskutusjärjestelmä. GitHub-tag-store sopii nykyiseen yhden ylläpitäjän Coreen ja kehitysvaiheen historiaan. Workspace-/multi-user- ja maksullisessa versiossa Run Store kannattaa myöhemmin siirtää varsinaiseen tietokantaan tai tapahtumavarastoon, mutta `Run Record`- ja `Usage`-rajapinnat on tarkoituksella erotettu käyttöliittymästä, jotta backend voidaan vaihtaa ilman Coren purkamista.
