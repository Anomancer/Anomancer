# Anomancer 16.3.2 · Mobile Workspace

## Tavoite

Puhelin ei renderöi Lähetyskonetta desktopin pienennettynä kopiona. Mobiilissa tärkein pinta on sisältö, ja navigointi asuu peukalon ulottuvilla alapalkissa.

## Mobiilidokki

- **Lähetykset** avaa täyskorkean sivudrawerin.
- **Kirjoita** avaa Markdown-editorin.
- **Evidenssi** avaa evidenssikerroksen.
- **Agentit** avaa yksittäisagentit ja toimitusorkesterin.
- **Lisää** avaa komentolevyn, jossa ovat tallennus, julkaisu, esikatselu, Core, työtila, asettelu, julkinen sivu ja poistuminen.

## Tilankäyttö

Sticky editoritabit ja vanha sticky Tallenna/Julkaise-rivi poistetaan alle 760 px leveydessä. Topbar kutistuu aktiivisen lähetyksen tunnisteeksi. Markdown-editori käyttää vähintään 58dvh korkeutta.

## Esikatselu

Esikatselu on mobiilissa oma overlay-näkymä, joka voidaan sulkea ilman editorin scroll-paikan menettämistä. Desktopin rinnakkainen preview-logiikka säilyy ennallaan.

## Turvaraja

Muutos ei koske Agent Contracteja, Tool Brokeria, Model Routeria, Runtime Snapshotia, evidenssin varmennusta eikä ihmisen julkaisuporttia. Mobiilin Julkaise-painike käyttää samaa olemassa olevaa `publishReview()`-porttia kuin desktop.

## Regressio

`scripts/test-mobile-workspace-1632.mjs` varmistaa dokin viisi kohdetta, mobiilissa piilotettavat desktop-tabbarit, proxy-tallennus/julkaisuohjauksen, overlay-esikatselun, täyskorkean lähetysdrawerin, editorin mobiilimitoituksen ja safe-area-tuen.
