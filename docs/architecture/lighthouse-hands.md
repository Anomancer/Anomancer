# Lighthouse Hands

Lighthouse voi lukea rajattuja projektitiedostoja palvelinpuolen `project-source`-adapterin kautta. Lukeminen on paikallista ja eksplisiittisesti rajattua eikä vaadi ulkoista versionhallintapalvelua.

## Rajat

- `repository.read` lukee vain turvallisiksi luokiteltuja projektipolkuja.
- Salaisuus-, ympäristö-, deploy-metadata-, generated output- ja sisäiset state-polut estetään oletuksena.
- Kirjoitus on eri capability: `project.write`.
- `project.write` vaatii tarkan ihmisen hyväksynnän ja on käytettävissä vain paikallisessa kehitysympäristössä.
- Vercel-tuotantoruntime ei saa muokata lähdekoodipuuta.

Tuotantoon vienti tapahtuu erillisen paikallisen release gaten jälkeen komennolla `vercel --prod`.
