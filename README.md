# Anomancer 14.2 · Full Release

Anomancer on kaksikielinen staattinen sivusto, Markdown-pohjainen julkaisukone ja yksityinen Vercel-admin. Julkinen sisältö rakennetaan `public/`-hakemistoon. Admin tallentaa artikkelit GitHub Contents API:n kautta ja käyttää DeepSeek-agentteja vain ehdotusten tuottamiseen.

## 14.2:n tärkeimmät rajat

- Agentti ei tallenna eikä julkaise.
- Agentin löytämä lähde syntyy aina tilaan `candidate`.
- Ihmisen pitää merkitä lähde tilaan `verified` ennen julkaisua.
- `supported`-väite vaatii vähintään yhden tarkistetun lähteen.
- Orkesterin checkpoint on sidottu artikkelin polkuun, GitHub-SHA:han ja lähtötilan sormenjälkeen.
- Luonnoksen voi tallentaa keskeneräisenä; julkaisu käyttää tiukempaa validointia.

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

Valinnaisia DeepSeek-asetuksia ovat `DEEPSEEK_MODEL`, `DEEPSEEK_WRITER_MODEL`, `DEEPSEEK_CRITIC_MODEL`, `DEEPSEEK_SOURCE_MAX_OUTPUT_TOKENS`, `DEEPSEEK_SOURCE_REASONING_EFFORT` ja `DEEPSEEK_TIMEOUT_MS`.

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
- `ORCHESTRATOR.md` — seitsemän agentin putki, checkpointit, retryt ja peruutus
- `CHANGELOG.md` — version 14.2 muutokset

