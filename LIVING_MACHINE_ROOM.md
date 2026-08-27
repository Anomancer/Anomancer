# Anomancer 16.3 · Living Machine Room

16.3 tekee orkesteriajon etenemisestä näkyvän ilman agenttien sisäisen päättelyn paljastamista.

## Periaate

**Reasoning private. Execution observable. Raccoon public.**

Orkestroija tuottaa vain vakioituja käyttöliittymätelemetrian tapahtumia. Tapahtumien `detail` on allowlistattu, eikä siihen saa päästä promptteja, käyttäjän tekstiä, raakaa agenttivastausta, kokonaista post-objektia, outputteja tai chain-of-thoughtia.

## Esitystilat

- **Työrauha**: vain faktuaalinen vaihe- ja tilarivi. Ei hahmoa eikä animaatioita.
- **Elävä konehuone**: hillitty prosessikursori ja asiallinen tilakommentti.
- **OE-tila**: sama telemetria, mutta absurdimpi käyttöliittymäcopy ja pesukarhun reaktiot.

Esitystila tallennetaan vain selaimen `localStorage`:en. Se ei muuta agenttisopimuksia, mallireititystä, tokenbudjetteja, evidenssisääntöjä, työkaluvaltaa tai julkaisuvaltaa.

## Turvallinen event-sanasto

Esimerkiksi `RUN_STARTED`, `STAGE_STARTED`, `STAGE_COMPLETED`, `SOURCE_FOUND`, `CRITIC_FLAGS`, `CLAIMS_CHECKED`, `PARTIAL_SOURCE_SUPPORT`, `PACKAGE_READY`, `MODEL_RETRY`, `TOOL_DENIED`, `API_ERROR`, `PARALLEL_STARTED`, `PARALLEL_MERGED`, `RUN_COMPLETED` ja `HUMAN_APPLIED`.

## Ei feikattua ajatteluteatteria

Konehuone ei näytä "AI ajattelee" -tekstiä. Se näyttää vain todellisen orkestrointitapahtuman ja siitä johdetun turvallisen käyttöliittymäviestin. Fakta ja humoristinen copy ovat erilliset kentät.

## Saavutettavuus

Faktuaalinen tilarivi käyttää `aria-live="polite"`. `prefers-reduced-motion` poistaa animaatiot. Työrauha tarjoaa täysin staattisen vaihtoehdon.
