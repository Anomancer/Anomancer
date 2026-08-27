# Anomancer 16.6.0 · Narramancer Vertical Slice

**16.6.0:** Lähetyskoneessa on nyt ensimmäinen Anomancerista aidosti eristetty uusi työtilatyyppi. `Työtila: Narramancer` vaihtaa editorin metadataohjattuun tarinatyötilaan, jossa ovat Projekti, Maailma, Hahmot, Juoni, Luvut, Aikajana, Kaanon, Orkesteri ja Vienti.

Narramancerilla on oma Workspace Template, Constitution Contract, workspace-kohtainen private Artifact Store, yhdeksän narratiivisen agentin orkesteri sekä vain paikalliset vientipolut. Anomancerin julkaisut eivät näy Narramancerissa eikä Narramancerilla ole automaattista julkaisukykyä.

Katso `NARRAMANCER_VERTICAL_SLICE_16_6.md`, `WORKSPACE_TYPES_ARTIFACT_BOUNDARY_16_5.md` ja `FULL_RELEASE_16_6_0.md`.

## Tarkistus

```bash
npm run check
```

Narramancerin kohdistettu hyväksymistesti:

```bash
npm run test:narramancer
```

## Content-safe asennus

```bash
chmod +x INSTALL_TO_CURRENT.sh
./INSTALL_TO_CURRENT.sh /täysi/polku/Anomancer
```

Asennin ei kopioi `content/`, `media/`, `public/`, rakennettuja lähetyksiä tai `.env`-salaisuuksia paketin mukana.
