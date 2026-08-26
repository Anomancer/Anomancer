# Anomancer 15.1.0 · Public Core Showcase · overlay patch

Tämä paketti on tarkoituksella **overlay-patch**, ei `rsync --delete` -full release.
Se päivittää nykyisen Anomancer-repon Coren julkiseksi arkkitehtuurinäkymäksi säilyttäen myöhemmin lisätyt artikkelit ja muut tiedostot.

## Mitä muuttuu

- `/core` = julkinen, indeksoitava Core Showcase.
- `/admin` = yksityinen control plane, edelleen noindex + no-store.
- Julkinen Core ei kutsu `/api/admin/*`-rajapintoja.
- Build tuottaa `core-public.json`-snapshotin Agent Registrystä ilman raakaa promptia, raakaa outputia tai ajohistoriaa.
- `/core` lisätään sitemapiin ja `llms.txt`:ään.
- Etusivun Core-kuvaus kertoo nyt julkisen ja yksityisen näkymän eron.
- Domain migration -testistä poistetaan kovakoodattu FI-artikkelien lukumäärä.

## Asennus

Aja `INSTALL_TO_CURRENT.sh /polku/Anomancer` tai kopioi `files/` nykyisen repon päälle ilman `--delete`-optiota.
