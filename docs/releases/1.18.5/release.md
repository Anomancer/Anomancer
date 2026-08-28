# Anomancer 1.18.5 — Live Path Verification & Canary Gate

1.18.5 on 1.18.4 P3 Capability Wiringin live-kovennus. Se ei avaa automaattista tuotantokirjoitusta, automergea tai mielivaltaista shell-toimivaltaa.

Keskeiset muutokset:

- eksplisiittisesti pakotettava operation repository allowlist ensimmäistä live-canarya varten
- testit ja preview täsmälliseen operation commit SHA:han branchin sijaan
- default-haaran SHA ennen/jälkeen repository-write-evidenssiin
- `drifted` fail-closed -tila, joka sulkee testipolun jos pohjahaara liikkuu
- täsmällinen GitHub Actions run-name -sidonta operation id:n ja moden mukaan
- preview-workflow `--target=preview --skip-domain` -suojalla
- Operation Consoleen live-polun porttinäkymä ja laajempi execution-evidenssi
- uusi `npm run live:preflight` ilman sivuvaikutuksia
- uudet 1.18.5 live-path backend- ja UI-regressioportit

Turvarajat säilyvät:

```text
plan
→ written approval bound to plan hash
→ execute
→ external evidence refresh
```

Default-haaraa ei kirjoiteta suoraan. Pull requestia ei automergeta. Production käyttää merged PR:n tarkkaa merge SHA:ta ja vaatii release-checkin sekä ihmisen julkaisupäätöksen.

Tekninen kuvaus: `LIVE_PATH_VERIFICATION_1_18_5.md`.
