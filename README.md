# ANOMANCER V13.5 · HUMAN LIBRARY

Lähetyskoneen ihmiskäännöskerros. Sisältö järjestyy nyt lukijan ongelmien ja hyödyn mukaan, ei projektien sisäisen sanaston mukaan.

## V13.5

- 8 ihmislähtöistä aihealuetta: AI arjessa ja työssä; tieto, väitteet ja media; työ ja päätöksenteko; raha ja riskit; ohjelmistot ja turvallisuus; kieli ja oppiminen; luovuus; yhteiskunta.
- erillinen **Kenelle tästä on hyötyä?** -luokitus: kaikille, työntekijälle, yrittäjälle, kehittäjälle, opettajalle, luovalle tekijälle, päättäjälle, sijoittajalle.
- julkisella Lähetykset-sivulla aihe- ja yleisösuodattimet toimivat yhdessä.
- vanhat kategoriat muunnetaan automaattisesti uusiin, joten olemassa olevat Markdownit eivät hajoa.
- audience tallentuu frontmatteriin ja näkyy korteissa, artikkeleissa sekä Schema.org-audience-metadatassa.
- Build log poistui julkisesta kategoriarakenteesta. Periaate: **älä julkaise projektia, julkaise hyöty.**

## Aiemmat ominaisuudet

# ANOMANCER V13.4 · MEDIA PIPE

V13.4 tuo kuvat samaan julkaisuputkeen tekstien kanssa. Admin pakkaa JPG/PNG/WebP-kuvat selaimessa, tallentaa ne GitHub-repon `media/YYYY/MM/`-hakemistoon ja build kopioi ne julkiseksi `/media/...`-poluksi. Kansikuva tallentuu artikkelin metadataan ja toimii myös artikkelikortissa, Open Graph -kuvana ja JSON-LD:n `image`-kenttänä. Tekstin sisäiset kuvat lisätään Markdowniin kursorin kohdalle.

- **Kansikuva**: Valitse / vaihda kuva + alt-teksti
- **Lisää kuva tekstiin**: kuva + alt-teksti + valinnainen kuvateksti
- max 1600 px, WebP-pakkaus selaimessa, max 2 Mt palvelimelle
- vain JPG / PNG / WebP, palvelin tarkistaa myös tiedoston magic bytes -sisällön
- kuvat kulkevat: `/admin → GitHub media/ → master → Vercel → /media/`
- ei uusia salaisuuksia, palveluita tai ympäristömuuttujia

# ANOMANCER V13.3 · PUBLIC URL CONTROL

V13.3 lisää adminiin näkyvän julkisen URL-esikatselun sekä julkaistulle lähetykselle suoran **Avaa julkinen lähetys ↗** -napin. URL päivittyy otsikon, kielen ja slugin mukana. Luonnoksella nappi pysyy piilossa, ja julkaistun slugin muuttamisen jälkeen nappi aktivoituu vasta kun muutos on julkaistu.

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
GITHUB_BRANCH=master
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

## 13.6 · MOBILE SURGERY

- Etusivun ANOMANCER-hero skaalautuu puhelimeen ilman vaakakarkaamista.
- Lähetykset-otsikko pysyy viewportin sisällä myös kapeilla näytöillä.
- Aihe- ja kohderyhmäfiltterit vierivät vaakaan oman alueensa sisällä eivätkä levennä koko sivua.
- Korttien, artikkelien, kuvien ja pitkien otsikoiden mobiilileveydet on rajattu turvallisesti.
- Desktop-tyyli säilyy ennallaan.

## 13.7 · HUMAN GATEWAY

- Erillinen Uusin lähetys -nosto poistettu. Kaikki julkaisut ovat yhdessä tasavertaisessa listassa.
- Etusivun hero kertoo suoraan hyödyn: monimutkaiset järjestelmät avataan ja käännetään ihmisille.
- Etusivulle lisätty Kuka minä olen? -osio.
- Julkinen identiteetti: järjestelmäajattelija, konseptisuunnittelija ja prototyyppaaja.
- Modular Creative Intelligence kokoaa monialaisen tekemisen yhden ymmärrettävän kehyksen alle.
- FI/EN-sivut päivitetty samaan rakenteeseen.


## 13.8 · Desktop Type Calm
Desktopin hero-, identiteetti-, reitti-, lähetys- ja artikkeliotsikoiden maksimikokoja rauhoitettu. Mobiilin 13.6-kirurgia säilyy ennallaan.

## 13.9 · Story + Identity Title Fix

- Kuka minä olen? -osioon lisätty tausta kolmen vuoden AI-seurannasta, globaalista ja suomalaisesta kehityksestä, disinformaatiosta, algoritmeista ja intensiivisestä oppimisjaksosta.
- Lisätty koulutustausta: lähihoitaja, vammaisohjaaja ja ilmanvaihtoasentaja.
- Desktop-otsikko lyhennetty muotoon “En mahdu yhteen titteliin.” ja sen palsta/skaalaus rajattu niin, ettei teksti törmää oikeaan sisältöön.
- Englanninkielinen sivu päivitetty samaan tarinaan.


## V13.10 · PINNED ARTICLES

- Adminissa jokaiselle lähetykselle voi asettaa `Pinnaa lähetys` -valinnan.
- `pinned: true` tallentuu Markdown-frontmatteriin.
- Pinnatut julkaisut nousevat Lähetykset/Dispatches-listan alkuun.
- Pinnattujen keskinäinen järjestys on edelleen päivämäärän mukaan.
- Julkisessa kortissa näkyy pieni Pinnattu/Pinned-merkintä.
- RSS pysyy kronologisena eikä pinnaus sotke syötteen ajallista luonnetta.


## V13.11 · HUMAN CONTACTS

- Updated public contact email to `alakhapositu@proton.me`.
- Added the human-facing Instagram account `@kaikkeudenkasvot` to the FI and EN home footers.
- Added Instagram to Person `sameAs` structured data.
- ANOMANCER keeps human-facing contacts here; project/system links remain in the Observatory.
