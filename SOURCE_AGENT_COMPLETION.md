# Anomancer 14.0.3 · Source Agent Completion Control

14.0.3 stabiloi Lähdeagentin pitkät web-haut ilman että tutkimuslogiikkaa muutetaan geneeriseksi.

## Muutokset

- DeepSeek Responses API:n `incomplete_details.reason` välitetään näkyväksi metadataksi.
- UI erottaa `max_output_tokens`- ja `content_filter`-katkokset.
- Lähdeagentin vastausbudjetti on tiivistetty: enintään 6 lähdettä / ajo, 4 aukkoa ja 4 varoitusta.
- Oletusreasoning on `medium`, jotta `max_output_tokens`-budjetista jää enemmän näkyvälle lähdepaketille.
- `DEEPSEEK_SOURCE_MAX_OUTPUT_TOKENS` on säädettävissä välillä 3000–12000, oletus 7000.
- `DEEPSEEK_SOURCE_REASONING_EFFORT` hyväksyy `low`, `medium`, `high`, oletus `medium`.
- Katkenneesta JSONista yritetään pelastaa kokonaiset `candidateSources`-objektit.
- Pelastetut lähteet voidaan siirtää editoriin vain ihmisen erillisellä hyväksynnällä.
- Lähdeagentin tuloksen jälkeen näkyy `Hae lisää`, joka tekee uuden haun aiemmat URL:t poissulkien.
- Mikään agentti ei saa GitHub-writeä tai automaattista julkaisuoikeutta.

## Periaate

`SOURCE SEARCH -> COMPACT RESULT -> COMPLETION STATUS -> PARTIAL SALVAGE -> HUMAN REVIEW -> OPTIONAL MORE SEARCH`
