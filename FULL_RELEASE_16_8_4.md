# Anomancer 16.8.4 · Full Release

Sisältää 16.8.0 Core Shell Semanticsin, 16.8.1 Responsive Workspace Navigationin, 16.8.2 Narramancer Authoring Maturityn, 16.8.3 Evidence Interactionin ja 16.8.4 Visual System Consolidation -kerroksen.

## Toimitettu 16.8.4

- yksityisen UI:n CSS jaettu seitsemään yksiselitteiseen vastuu-/token-kerrokseen
- `admin.css` muutettu kevyeksi stylesheet-manifestiksi
- kaikki yksityisen UI:n media queryt keskitetty `admin-responsive.css`:ään
- semanttista tokenikerrosta laajennettu surface-, border-, focus-, overlay-, typografia- ja tilatokeneilla
- komponentti-CSS:n `!important`-käyttö rajattu yhteen visibility-sääntöön
- kaikki suorat ja shorthand-fonttikoot kovetettu vähintään 12 pikseliin; tavallisen UI:n peruskoko 14 px
- pakollisille kontrolleille 44 px kosketuskohteen minimi
- mobiilin pysyvää yläkromia tiivistetty ilman navigaation amputointia
- lisätty deterministinen pitkä/tyhjä/virhe/evidenssi/Narramancer-visuaalifixture
- lisätty oikeassa Chromium-renderissä ajettava seitsemän skenaarion viewport-, focus-, overflow- ja accessibility-matriisi
- lisätty `scripts/read-admin-css.mjs`, jotta vanhat regressiot tarkistavat uuden modulaarisen CSS-koosteen eivätkä historiallista jättitiedostoa
- lisätty `scripts/test-visual-system-1684.mjs` osaksi `npm run check` -release-porttia

## Rajat

16.8.4 ei muuta Agent Contracteja, Constitutioneja, Artifact Boundarya, Evidence Layerin totuusmallia, publish gatea, human approval -valtaa tai julkisen/yksityisen datan rajaa.

## Hyväksyntä

Release ei mene läpi pelkillä CSS-/HTML-lähdetarkistuksilla. Hyväksyntä vaatii myös oikean selainrenderin ilman vaakavuotoa, liian pieniä pakollisia tekstejä/kosketuskohteita, kadonnutta fokusta tai kriittisen responsiivisen hierarkian rikkoutumista.
