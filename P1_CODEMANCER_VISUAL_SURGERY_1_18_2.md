# Anomancer 1.18.2 — P1 Codemancer Visual Surgery

Tämä patch toteuttaa Senior Lead UI/UX -auditin Codemancer-painotteisen P1-korjausportin. Tavoite on palauttaa geneerinen Mancer Workbench yhteisen Visual Systemin alle ja saada ensimmäinen oikea työohjain näkyviin mobiilin ensimmäiseen työruutuun.

## Design-tokenien eheys

Viisi käytössä ollutta mutta määrittelemätöntä muuttujaa korvattiin kanonisilla tokeneilla:

| Poistettu viittaus | Kanoninen token |
|---|---|
| `--accent` | `--color-accent` |
| `--border` | `--color-border` |
| `--panel-soft` | `--color-surface-subtle` |
| `--color-success-strong` | `--color-success` |
| `--color-danger-strong` | `--color-danger` |

Uusi regressioportti parsii kaikki juuritason CSS-lähteet. Käytössä oleva custom property saa olla määrittelemätön vain, jos `var()` sisältää eksplisiittisen fallbackin.

## Codemancerin kontrollisopimus

Geneerisen Mancer-lomakkeen `input`, `select` ja `textarea` käyttävät nyt samaa sopimusta:

- vähintään 44 px kosketuskorkeus;
- `--color-surface-input`-pinta ja `--color-border-input`-reunus;
- vahva tekstitoken ja brändin caret/accent;
- eksplisiittiset hover-, focus-visible- ja disabled-tilat;
- tokenisoitu kulmasäde, padding ja monospace-fontti;
- `color-scheme: dark` ilman select-elementin natiivin toiminnan poistamista;
- 16 px kontrolliteksti alle 760 px leveydessä iOS-automaattizoomin estämiseksi.

## Mobiilin sisältöhierarkia

Codemancerin mobiilinäkymän yläosa ei enää pinoudu pitkäksi desktop-korttijonoksi.

- komentopalkki pysyy yhdellä rivillä ja piilottaa puhelimessa toistuvan kickerin, constitution-kuvauksen ja erillisen tallennustilatekstin;
- osio-otsikko tiivistyy ja tekninen `Lomake`/`Kokoelma`-tyyppitunniste piilotetaan;
- ihmisen lopullinen päätösvalta säilyy näkyvänä `Ihminen hyväksyy` -tunnisteena;
- varsinainen työ renderöidään ennen teknistä package-/approval-/orchestra-/archive-metadataa;
- tekninen metadata säilyy näppäimistökäytettävässä, oletuksena suljetussa `details`-luukussa.

Muutos koskee geneeristä Mancer-rendereriä, joten rakenne toimii Codemancerin lisäksi samalla sopimuksella asennettaville tuleville Mancer-paketeille.

## Regressioportit

`scripts/test-p1-codemancer-visual-1182.mjs` tarkistaa tokenit, kontrollisopimuksen, mobiilisäännöt, governance-/work-järjestyksen, fixture-sopimuksen sekä juuri- ja `public/`-peilien identtisyyden.

`scripts/test-mancer-ui-118.mjs` mittaa oikeassa Chromiumissa 1440×900- ja 360×800-koossa lisäksi:

- horisontaalisen ylivuodon;
- 44 px kontrollikorkeuden;
- kontrollin taustan, tekstikontrastin, reunan, kulmasäteen ja paddingin;
- ensimmäisen työohjaimen sijainnin suhteessa tekniseen disclosureen;
- mobiilikomennuspalkin korkeuden;
- mobiilikontrollin vähintään 16 px tekstikoon.

Selainportti vaatii edelleen järjestelmä-Chromiumin. Selaimeton P1-portti kuuluu `npm run check` -ketjuun heti P0-eheysportin jälkeen.
