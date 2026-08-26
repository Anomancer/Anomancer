# Anomancer 15.5 · Model Router

Model Router erottaa agentin identiteetin mallitarjoajasta. Agent Contract määrittää loogisen reitin (`research`, `writer` tai `critic`), ja palvelin valitsee sen reitin sallituista provider-targeteista. Mallin vaihtaminen ei muuta agentin työkaluja, capabilityja, toimivaltaa tai Tool Broker -politiikkaa.

## Loogiset reitit

| Route | Oletus | Sallitut targetit | Erityisvaatimus |
| --- | --- | --- | --- |
| research | `deepseek.research` | DeepSeek, OpenAI, Gemini | JSON + web search |
| writer | `deepseek.writer` | DeepSeek, OpenAI, Anthropic, Gemini | JSON |
| critic | `deepseek.critic` | DeepSeek, OpenAI, Anthropic, Gemini | JSON |

Runtime Profile saa pyytää vain oman route-rajan sisäistä `modelTarget`-arvoa. Palvelin normalisoi arvon ja palauttaa tuntemattoman tai väärän reitin targetin turvalliseen oletukseen.

## Provider-asetukset

DeepSeek käyttää nykyisiä `DEEPSEEK_*`-asetuksia ja pysyy oletuksena, joten 15.5 toimii ilman uusia ympäristömuuttujia. Muut providerit aktivoituvat vain, kun sekä API-avain että mallinimi on asetettu palvelimelle.

OpenAI:
- `OPENAI_API_KEY`
- `OPENAI_MODEL` tai reittikohtaiset `OPENAI_RESEARCH_MODEL`, `OPENAI_WRITER_MODEL`, `OPENAI_CRITIC_MODEL`

Anthropic:
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL` tai `ANTHROPIC_WRITER_MODEL`, `ANTHROPIC_CRITIC_MODEL`

Gemini:
- `GEMINI_API_KEY`
- `GEMINI_MODEL` tai `GEMINI_RESEARCH_MODEL`, `GEMINI_WRITER_MODEL`, `GEMINI_CRITIC_MODEL`

Operaattori voi lisäksi asettaa reittikohtaisen ensisijaisen targetin ympäristömuuttujilla `ANOMANCER_ROUTE_RESEARCH_TARGET`, `ANOMANCER_ROUTE_WRITER_TARGET` ja `ANOMANCER_ROUTE_CRITIC_TARGET`. Arvo hyväksytään vain, jos se kuuluu kyseisen reitin sallittuihin targetteihin.

## Fallback

Fallback ei ole lupa vaihtaa agentin tehtävää. Router pysyy aina saman loogisen reitin sisällä. Se kokeilee seuraavaa sallittua ja konfiguroitua targettia vain, jos ensisijainen target puuttuu tai saa tilapäisen virheen, kuten rate limitin, 5xx-virheen, verkkovirheen tai aikakatkaisun. Ei-retryable sisältö-/JSON-virhettä ei peitetä toisella providerilla.

## Tool Broker ja toimivalta

Model Router ja Tool Broker ovat erillisiä kerroksia. Esimerkiksi Source Agent tarvitsee edelleen `web.search`-luvan Tool Brokerilta riippumatta siitä, käyttääkö Research-route DeepSeekiä, OpenAI:ta vai Geminiä. Mallin vaihtaminen ei koskaan lisää työkalua tai toimivaltaa.

## Jäljitettävyys

Run Receipt sisältää valitun route-, target-, provider- ja mallimetadatan sekä tiedon fallbackista ja yritysten tiloista. API-avaimia ei tallenneta kuittiin. Julkinen `/core` näyttää tuetut providerit ja reitit, mutta ei paljasta mitkä providerit on tuotannossa konfiguroitu. Yksityinen `/admin` saa näyttää turvallisen configured/offline-tilan ilman avaimia.

## Nykyinen rajaus

15.5 ei vielä laske provider-kohtaista rahakustannusta eikä tallenna Model Router -valintoja workspace-palvelimelle. Runtime Profile on edelleen admin-selaimen paikallinen ohjauskerros. Mallinimet tulevat palvelimen ympäristömuuttujista, eivät vapaasta client-inputista.
