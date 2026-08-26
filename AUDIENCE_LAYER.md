# Anomancer 14.3.0 · Audience Layer

Audience Layer erottaa tekstin epistemisen ytimen siitä, miten sama asia esitetään eri lukijalle.

## Audience Contract

Ihminen valitsee editorissa:

- kohdeyleisön: `all`, `employee`, `entrepreneur`, `developer`, `teacher`, `creative`, `decision-maker`, `investor`
- syvyystason: `plain`, `general`, `professional`, `technical`

Nämä arvot tallentuvat Markdown-frontmatteriin ja kulkevat koko agenttiputken mukana. Vanha sisältö ilman `audienceDepth`-kenttää normalisoituu arvoon `general`.

## Mitä adapteri saa muuttaa

Yleisöadapteri saa muuttaa:

- kehystystä ja asioiden järjestystä
- otsikoita ja kappalerakennetta
- esimerkkejä ja määritelmiä
- terminologian tiheyttä
- sitä, mitä seurauksia tai näkökulmia nostetaan ensin

Se ei saa:

- vahvistaa väitteen varmuutta
- keksiä uusia empiirisiä väitteitä, lukuja tai lupauksia
- muuttaa lähteen `candidate / verified / rejected` -tilaa
- kirjoittaa `claims`- tai `sources`-kenttiä
- muuttaa suositusta todistetuksi tosiasiaksi

## Orkesteri

14.3.0:n järjestys on:

`source → structure → writer → critic → audience → voice → claims → package`

Rakenne-, kirjoitus- ja kriitikkovaiheet näkevät Audience Contractin jo ennen varsinaista sovitusta. Audience Adapter tekee eksplisiittisen kohdennuksen. Voice Editor viimeistelee tämän version muuttamatta kohdennusta. Claim Watcher auditoi vasta tämän jälkeen nykyisen lopullisen proosan.

Package-agentti ei saa vaihtaa `audience`- tai `audienceDepth`-arvoja. Palvelinvalidointi palauttaa niihin aina ihmisen valitseman tilan riippumatta siitä, mitä malli mahdollisesti yrittää ehdottaa.

## Ajatusmalli

Audience Layerin periaate on: **sama episteminen ydin, eri havaintopositio**.

Opettajalle voidaan määritellä käsite ennen mekanismia. Kehittäjälle voidaan aloittaa järjestelmärajasta. Sijoittajalle voidaan nostaa ensin riski, governance ja skaalautuvuus. Näiden versioiden ei kuitenkaan pidä saada eri “totuutta” vain siksi, että lukija vaihtui.
