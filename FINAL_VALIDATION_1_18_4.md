# Final Validation — Anomancer 1.18.4 P3

Päivä: 2026-08-28

## Tulos

- P3 capability backend: **7/7 PASS**
- P3 Operations UI, Package Spec ja CI/CD-sopimus: **7/7 PASS**
- koko ei-selaimellinen release-ketju: **57/57 PASS**
- build + root/public-peilit: **PASS**
- Domain migration + SEO: **PASS**
- JavaScript- ja shell-syntaksitarkistus: **PASS**
- GitHub Actions YAML parse sekä workflow’n Bash-regexit: **PASS**

Yhdeksän olemassa olevaa Chromium-porttia ovat edelleen pakollisessa `npm run check` -ketjussa. Tässä pakkausympäristössä ei ole Chromium-binääriä, joten niitä ei väitetä ajetuiksi. GitHub Actions ratkaisee `CHROMIUM_BIN`-polun ennen koko ketjun ajoa ja pysäyttää deployn, jos selainta ei löydy tai yksikin portti epäonnistuu.

## Todennetut P3-rajat

1. Tuntematon capability ja komentomerkkijono fail-closed.
2. Operations API vaatii admin-session; mutaatio vaatii same-origin + sessioniin sidotun CSRF:n.
3. Repository-write vaatii hyväksytyn review’n, täsmällisen written confirmationin ja muuttumattoman artefaktin.
4. Repository-adapteri luo vain uuden `anomancer/op-*`-refin eikä tee default-haaraan PUT/PATCH-operaatiota.
5. Testi-, PR-, preview- ja production-portit avautuvat vain edellisen vaiheen evidenssistä.
6. PR ei automergaa; production vaatii merged PR:n sekä release-checkin ja ihmisen release-päätöksen.
7. Productionin checkout sidotaan täsmälliseen merge commit SHA:han.
8. Repository rollback poistaa vain muuttumattoman ja yhdistämättömän operation-haaran.
9. Deployment rollback sallii vain rajatun Vercel deployment -URLin tai `dpl_...`-id:n.
10. File path-, duplikaatti-, koko- ja secret-guardit suoritetaan ennen GitHub-kirjoitusta.
11. Operation-audit on workspace-scopeinen, revision-lukittu ja hash-ketjutettu.
12. Keskeytyneen branch- tai PR-sivuvaikutuksen tila voidaan palauttaa GitHub-evidenssistä ilman uuden sivuvaikutuksen sokkona toistamista.

## Ei suoritettu pakkausvaiheessa

Pakkaus ei käynnistä oikeaa GitHub repository-writea, Actions-workflow’ta tai Vercel-deployta. Ne pysyvät ihmisen plan/approve/execute-portin takana ja vaativat kohdeympäristön tokenit, GitHub Actions secrets -arvot sekä production-environmentin reviewer-asetuksen.
