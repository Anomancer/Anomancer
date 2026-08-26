# Anomancer 15.9.2 · Workspace Foundation

Anomancer on kaksikielinen staattinen sivusto, Markdown-pohjainen julkaisukone ja yksityinen Vercel-admin. Julkinen sisältö rakennetaan `public/`-hakemistoon. Admin tallentaa artikkelit GitHub Contents API:n kautta. Agenttien mallikutsut kulkevat palvelinpuolen Model Routerin kautta; DeepSeek säilyy oletuksena ja muut providerit ovat valinnaisia.

## 15.0 · Core Foundation

Anomancerin Lähetyskone toimii nyt ensimmäisenä natiivina Core-orkesterina. `server/core-registry.js` määrittää keskitetysti kahdeksan Agent Contractia, niiden roolit, mallireitit, työkalut, toimivallan ja tokenbudjetit. `editorial/1.0.0` määrittää orkesterin vaihejärjestyksen. Jokainen onnistunut agenttiajo tuottaa `anomancer-run-receipt/v1` -kuitin, joka sisältää metadatan sekä input/output-hashit, ei raakaa promptia tai vastausta. Selain ylläpitää näistä paikallista hash-ketjutettua Run Ledgeriä Core-välilehdellä.

15.4 lisäsi Tool Brokerin, 15.5 Model Routerin ja 15.6 server-authoritative Runtime Profilet. 15.7 teki orkesterista ensimmäisen luokan serverisopimuksen. 15.8 lisäsi server-side Run Storen, Run Explorerin ja Usage Meteringin. 15.9 lisää Workspace Foundationin: Runtime Profiles, Custom Orchestras, Runs ja Usage eristyvät työtiloittain, kun taas Agent Registry, Tool Broker ja Model Router pysyvät yhteisenä platform-kerroksena. Nykyinen historia jatkuu automaattisesti `default`-workspacessa ilman migraatiota. Core ei vielä sisällä monen käyttäjän ACL- tai maksukerrosta eikä custom-agenttien luontia.

## 14.3.1:n tärkeimmät rajat ja Audience Layer

- Agentti ei tallenna eikä julkaise.
- Kohdeyleisö ja syvyystaso ovat ihmisen valitsema `Audience Contract`: agentit saavat muuttaa kehystä, järjestystä, esimerkkejä ja terminologian tiheyttä, mutta eivät evidenssin vahvuutta.
- Yleisöadapteri ajaa kritiikin jälkeen; Äänieditori viimeistelee sen version ja Väitevahti auditoi vasta tämän lopullisen proosan.
- Agentin löytämä lähde syntyy aina tilaan `candidate`.
- Ihmisen pitää merkitä lähde tilaan `verified` ennen julkaisua.
- `supported`-väite vaatii vähintään yhden tarkistetun lähteen.
- Orkesterin checkpoint on sidottu artikkelin polkuun ja GitHub-SHA:han; tallentamattomalla uudella tekstillä lisäksi istuntokohtaiseen luonnos-ID:hen.
- Luonnoksen voi tallentaa keskeneräisenä; julkaisu käyttää tiukempaa validointia.

### Output-tokenbudjetit 14.3.1

| Agentti | Katto |
| --- | ---: |
| Source | 16 000 (env 8 000–32 000) |
| Structure | 12 000 |
| Writer | 24 000 |
| Critic | 12 000 |
| Audience | 24 000 |
| Voice | 24 000 |
| Claims | 16 000 |
| Package | 12 000 |

Rajat ovat enimmäismääriä, eivät tavoitepituuksia. Admin-loki näyttää käytön suhteessa kattoon.

## Paikallinen käyttö

Vaatimus: Node.js 20 tai uudempi.

```bash
npm run check
npm run build
```

Sisältö sijaitsee hakemistoissa `content/fi` ja `content/en`. Build tuottaa listat, artikkelit, RSS-syötteet, sitemapin sekä sisältö-, evidenssi- ja discovery-manifestit.

## Vercel-ympäristö

Admin tarvitsee vähintään seuraavat salaisuudet:

- `ADMIN_PASSWORD_HASH`
- `ADMIN_SESSION_SECRET`
- `GITHUB_CONTENT_TOKEN`
- `GITHUB_REPO` muodossa `owner/repo`
- `GITHUB_BRANCH`
- `DEEPSEEK_API_KEY`

Valinnaisia DeepSeek-asetuksia ovat `DEEPSEEK_MODEL`, `DEEPSEEK_WRITER_MODEL`, `DEEPSEEK_CRITIC_MODEL`, `DEEPSEEK_SOURCE_MAX_OUTPUT_TOKENS`, `DEEPSEEK_SOURCE_REASONING_EFFORT` ja `DEEPSEEK_TIMEOUT_MS`. Vaihtoehtoiset Model Router -providerit aktivoituvat `OPENAI_*`, `ANTHROPIC_*` tai `GEMINI_*`-avaimilla ja mallinimillä; katso `MODEL_ROUTER.md`.

Generoi admin-salaisuudet:

```bash
npm run admin:hash
npm run admin:secret
```

Vercel käyttää projektin `vercel.json`-tiedostoa ja julkaisee `public/`-hakemiston. Admin löytyy reitistä `/admin`.

## Turvallinen päivitys olemassa olevaan projektiin

```bash
./INSTALL_TO_CURRENT.sh /täysi/polku/anomancer-projektiin
```

Asennin ei poista kohteen ylimääräisiä tiedostoja oletuksena. Korvatut tiedostot varmuuskopioidaan kohteen `.anomancer-backups/`-hakemistoon. Stale-tiedostojen poistaminen vaatii sekä `--delete-stale`-lipun että `ANOMANCER_INSTALL_CONFIRM=YES`-vahvistuksen.

## Tarkemmat kuvaukset

- `EVIDENCE_LAYER.md` — lähteiden provenance, tarkistustilat ja julkaisuportti
- `AUDIENCE_LAYER.md` — kohdeyleisö, syvyystaso ja epistemisen ytimen säilyttävä sovitus
- `ORCHESTRATOR.md` — kahdeksan agentin putki, checkpointit, retryt ja peruutus
- `TOOL_BROKER.md` — Tool Registry, Policy Gate, TOOL403 ja Policy Log
- `MODEL_ROUTER.md` — loogiset mallireitit, provider-targetit ja turvallinen fallback
- `SERVER_RUNTIME_PROFILES.md` — server-authoritative runtime, snapshotit ja revision-suoja
- `CUSTOM_ORCHESTRAS.md` — Orchestra Contract v2, builder, parallel isolation ja Orchestra Store
- `RUN_EXPLORER.md` — server-side run history, usage ja replay metadata
- `WORKSPACE_FOUNDATION.md` — workspace-raja, legacy-yhteensopivuus ja server-authoritative scope
- `CHANGELOG.md` — version 14.3.x muutokset

## 15.9.2 · Hobby Function Layout

Vercelin `/api`-hakemisto sisältää vain deployattavat HTTP-entrypointit. Kaikki jaettu serverikoodi on `server/`-hakemistossa, jotta helper-moduuleita ei lasketa erillisiksi Serverless Functions -funktioiksi Hobby-planilla. 15.9.2 pitää deployattavien `/api/**/*.js`-entrypointtien määrän 12:ssa.
