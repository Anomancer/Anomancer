# ANOMANCER V13.2 · ADMIN VISIBILITY FIX

Firefox/login hotfix: `[hidden]{display:none!important}` ensures login and admin views actually switch after successful authentication.

# ANOMANCER V13.1 · LÄHETYSKONE ADMIN · VERCEL FIX

V12:n Markdown-blogi + yksityinen `/admin`-CMS. Julkinen puoli pysyy staattisena, nopeana ja SEO-ystävällisenä. Admin kirjoittaa Markdown-tiedostot GitHub-repoon GitHub Contents API:n kautta. Kun sama repo on yhdistetty Vercel-projektiin, commit käynnistää uuden deploymentin automaattisesti.


## V13.1-korjaus

Vercelin Anomancer-projektissa Output Directory on `public`. Build stageaa nyt automaattisesti kaikki julkiset HTML/CSS/JS/XML-tiedostot `public/`-hakemistoon, samalla kun `/api` jää Vercelin serverless-funktioiksi. Julkinen `content-manifest.json` ei myöskään enää paljasta luonnosten nimiä tai tiedostopolkuja.

## Mitä V13 lisää

- `/admin` kirjautuminen
- scrypt-hashattu admin-salasana
- HttpOnly + Secure + SameSite=Strict -sessioeväste
- allekirjoitettu 12 h sessio
- CSRF-suojaus mutaatioille
- same-origin-tarkistus
- GitHub fine-grained token vain palvelinpuolella
- julkaisu-, luonnos- ja poisto-commitit GitHubiin
- FI / EN, kategoriat, slug, SEO-kuvaus, translation key
- Markdown-editori + live-esikatselu
- sana- ja lukuaikalaskuri
- julkaistut / luonnokset -suodatus
- `/admin` pois sitemapista ja robotsissa estetty
- admin/API no-store + noindex
- vanha localhost-editori säilyy hätäuloskäyntinä (`npm run write`)

## 1. Testaa ja buildaa

```bash
npm run check
npm run build
```

## 2. Tee admin-salasanan hash

```bash
npm run admin:hash
```

Kopioi tulostettu `scrypt$...`-arvo. Lisää Verceliin nimellä `ADMIN_PASSWORD_HASH`.

## 3. Tee session secret

```bash
npm run admin:secret
```

Lisää tulos Verceliin nimellä `ADMIN_SESSION_SECRET`.

## 4. GitHub-yhteys

Tee GitHubissa fine-grained Personal Access Token, joka on rajattu **vain tämän sivuston repoon** ja jolla on repository permission:

- Contents: Read and write

Vercel production environment:

```text
GITHUB_CONTENT_TOKEN=...
GITHUB_REPO=käyttäjä/repo
GITHUB_BRANCH=main
ADMIN_PASSWORD_HASH=scrypt$...
ADMIN_SESSION_SECRET=...
```

Älä koskaan lisää näitä selaimen JavaScriptiin tai commitoi `.env`-tiedostoa.

## 5. Yhdistä sama GitHub-repo Verceliin kerran

Kun projektikansiossa on Git remote ja projekti on linkitetty `anomancer`-Vercel-projektiin:

```bash
npx vercel link
npx vercel git connect
npx vercel --prod
```

Tämän jälkeen `/admin`-julkaisu tekee commitin GitHubin production-branchiin, ja Vercelin Git-integraatio deployaa muutoksen.

## 6. Käyttö

Avaa:

```text
https://anomancer.vercel.app/admin
```

Kirjaudu omalla admin-salasanalla. Valitse vanha lähetys tai `+ Uusi`, kirjoita ja paina:

- **Tallenna luonnos** → `draft: true`
- **Julkaise** → `draft: false`
- **Poista** → poistaa Markdown-tiedoston GitHubista commitilla

GitHub on sisällön totuus ja versiohistoria. Julkinen build tuottaa edelleen automaattisesti artikkelit, kategoriat, canonicalit, hreflangit, BlogPosting JSON-LD:n, sitemapin ja RSS:t.

## Turvarajat

`/admin`-osoitteen piilottaminen ei ole turvamekanismi. Varsinainen suoja on server-side salasana + allekirjoitettu HttpOnly-sessio + CSRF + GitHub-tokenin pitäminen vain Vercelin ympäristömuuttujassa.

Jos GitHub-token vuotaa, peru se GitHubissa heti. Jos session secret vuotaa, vaihda se, jolloin kaikki vanhat sessiot lakkaavat kelpaamasta.
