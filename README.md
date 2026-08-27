# Anomancer 16.7.0 · Navigation Shell

**16.7.0:** Anomancer Corella on nyt pysyvä globaali navigaatiokuori. Työtilat, Lähetykset, Artefaktit, Konehuone ja Asetukset ovat eri järjestelmätasoja, ja valitun työtilan omat työkalut muodostuvat Workspace Templaten navigaatiometadatasta.

Narramancer säilyttää 16.6:n eristetyn Constitution-, Artifact Store- ja orkesterimallin. 16.7 lisää sille ryhmitellyn paikallisnavigaation sekä vaiheistetun orkesteriajon, joka voidaan token- tai mallikatkon jälkeen jatkaa saman selainistunnon checkpointista.

Katso `NAVIGATION_SHELL_16_7.md`, `NARRAMANCER_VERTICAL_SLICE_16_6.md`, `WORKSPACE_TYPES_ARTIFACT_BOUNDARY_16_5.md` ja `FULL_RELEASE_16_7_0.md`.

## Tarkistus

```bash
npm run check
```

Navigation Shellin kohdistettu hyväksymistesti:

```bash
npm run test:navigation-shell
```

## Content-safe asennus

```bash
chmod +x INSTALL_TO_CURRENT.sh
./INSTALL_TO_CURRENT.sh /täysi/polku/Anomancer
```

Asennin ei kopioi `content/`, `media/`, `public/`, rakennettuja lähetyksiä tai `.env`-salaisuuksia paketin mukana. Kohteen oma build regeneroi julkaistut lähetykset sen omasta `content/`-aineistosta.
