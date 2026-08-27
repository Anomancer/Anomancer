# Navigation Shell Visual Hardening 16.7.1

## Tavoite

16.7 ratkaisi informaatiarkkitehtuurin. 16.7.1 tekee samasta rakenteesta visuaalisesti yksiselitteisen muuttamatta järjestelmän toimivaltaa.

### Kerros 1 · Core Shell
Pysyvä globaali header näyttää tuotteen, Core-reitit, yhteystilan ja asetukset.

### Kerros 2 · Workspace Context
Nykyinen työ, työtila, orkesteri ja tallennustila ovat omassa kontekstipalkissaan.

### Kerros 3 · Local Navigation
Workspace Templaten metadata määrää paikallisen navigaation. Tämä sopimus ei muuttunut 16.7.1:ssä.

## Keskeinen bugikorjaus

Vanha `.app { grid-template-columns:320px minmax(0,1fr) }` jäi CSS-cascadeen 16.7:ssä. Navigation Shell muutti grid-row't, mutta ei nollannut sarakkeita. Core Shell saattoi siksi renderöityä vanhan 320 px sivupalkkisarakeen sisään. 16.7.1 asettaa root-gridin eksplisiittisesti yhteen sarakkeeseen ja pakottaa Core Shellin sekä workspacen koko rivin levyisiksi.
