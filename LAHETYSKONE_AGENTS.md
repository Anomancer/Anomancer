# Anomancer 14.0 · Lähetyskone Agents

14.0 lisää yksityiseen `/admin`-Lähetyskoneeseen DeepSeek-pohjaisen toimituspöydän.

## Authority-malli

`AGENTTI EHDOTTAA → IHMINEN TARKISTAA → IHMINEN SIIRTÄÄ EDITORIIN → IHMINEN TALLENTAA / JULKAISEE`

Agentti-API ei kutsu GitHub-write-endpointteja eikä sillä ole julkaisutoimintoa. DeepSeek API-avain on vain Vercelin server-side environmentissa.

## Agentit

- **Lähdeagentti** käyttää DeepSeek Responses API:n server-side `web_search`-työkalua. Se tuottaa vain lähde-ehdokkaita, jotka ihmisen pitää tarkistaa.
- **Väitevahti** erottaa `supported / interpretation / open` ja saa käyttää vain Evidence Layerissa jo olevia lähteitä.
- **Rakenneagentti** ehdottaa rakennetta ilman että tekee tekstistä geneeristä listiclea.
- **Kirjoitusagentti** tuottaa Markdown-luonnoksen nykyisen materiaalin pohjalta.
- **Kriitikko** etsii heikot väitteet, epäselvyydet ja koneellisen tekstirytmin.
- **Äänieditori** poistaa geneeristä LLM-kadenssia mutta säilyttää ihmisen omituisuuden.
- **Julkaisupaketti** ehdottaa title/description/slug/answer/category/audience/evidence-metadataa.

## DeepSeek-asetus Vercelissä

Pakollinen:

```text
DEEPSEEK_API_KEY=...
```

Valinnaiset:

```text
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_WRITER_MODEL=deepseek-v4-flash
DEEPSEEK_CRITIC_MODEL=deepseek-v4-flash
DEEPSEEK_TIMEOUT_MS=75000
```

`Lähdeagentti` käyttää aina `deepseek-v4-flash`-mallia, koska 14.0 käyttää sen Responses API + web_search -yhdistelmää.

## Turvarajat

- admin-session vaaditaan
- POST vaatii CSRF + same-origin
- API-avain ei mene selaimeen
- enintään 60 000 merkkiä artikkelitekstiä yhteen agenttikutsuun
- enintään 2 000 merkkiä ihmisen lisäohjetta
- best-effort 24 agenttikutsua / 10 min / sessio + IP
- DeepSeekin reasoning-sisältöä ei palauteta käyttöliittymään
- agentin tulos ei tallenna eikä julkaise mitään automaattisesti
