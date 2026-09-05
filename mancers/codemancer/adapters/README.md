# Codemancer adapters

Codemancer lukee projektipuuta rajatun `project-source`-adapterin kautta. Lähdekoodin kirjoitus on paikallinen, eksplisiittisesti hyväksytty `project.write`-toiminto eikä selaimesta annettu vapaa komentorivi.

Vercel-tuotantoruntime ei kirjoita projektipuuta. Julkaisu tapahtuu paikallisen `npm run check` -portin jälkeen suoraan Vercel productioniin komennolla `npm run deploy:prod`.

Salaisuudet pysyvät palvelinympäristössä. Niitä ei palauteta selaimeen eikä tallenneta run-, archive- tai artifact-kuitteihin.
