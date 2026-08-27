# Anomancer 16.7.1 · Navigation Shell Visual Hardening

**16.7.1:** 16.7:n informaatiarkkitehtuuri säilyy, mutta Core Shellin vanhasta kaksisarakkeisesta app-gridistä periytynyt 320 px puristus on korjattu. Header, workspace-konteksti, Konehuoneen mittarit, spacing ja responsiivinen hierarkia on kovetettu.

Narramancer säilyttää 16.6:n eristetyn Constitution-, Artifact Store- ja orkesterimallin. 16.7 lisää sille ryhmitellyn paikallisnavigaation sekä vaiheistetun orkesteriajon, joka voidaan token- tai mallikatkon jälkeen jatkaa saman selainistunnon checkpointista.

Katso `NAVIGATION_SHELL_VISUAL_HARDENING_16_7_1.md`, `FULL_RELEASE_16_7_1.md`, `NAVIGATION_SHELL_16_7.md`, `NARRAMANCER_VERTICAL_SLICE_16_6.md`, `WORKSPACE_TYPES_ARTIFACT_BOUNDARY_16_5.md` ja `FULL_RELEASE_16_7_0.md`.

## Tarkistus

```bash
npm run check
```

Navigation Shellin kohdistettu hyväksymistesti:

```bash
npm run test:navigation-shell
npm run test:navigation-shell-visual
```

## Content-safe asennus

```bash
chmod +x INSTALL_TO_CURRENT.sh
./INSTALL_TO_CURRENT.sh /täysi/polku/Anomancer
```

Asennin ei kopioi `content/`, `media/`, `public/`, rakennettuja lähetyksiä tai `.env`-salaisuuksia paketin mukana. Kohteen oma build regeneroi julkaistut lähetykset sen omasta `content/`-aineistosta.
