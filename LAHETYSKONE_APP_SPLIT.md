# Lähetyskone App Split 16.4

16.4 erottaa yksityisen työkalun julkisesta Anomancerista käyttöliittymä- ja selainrajalla rikkomatta olemassa olevaa julkaisuputkea.

## Pinnat

- `/lahetyskone` on asennettava yksityinen PWA ja ainoa ensisijainen työosoite.
- `/admin` on yhteensopivuusosoite, joka ohjaa Lähetyskoneeseen.
- `/`, `/en`, `/core`, `/en/core`, `/lahetykset` ja `/dispatches` pysyvät julkisina Anomancer-pintoina.
- `/api/admin/*` säilyy yksityisenä palvelinrajana.

Service workerin scope on tarkoituksella vain `/lahetyskone`. Se ei hallitse, välimuistita tai korvaa julkisen Anomancerin navigaatioita. API-vastauksia, sessioita, luonnoksia, artikkeleita tai agenttituloksia ei lisätä PWA-välimuistiin.

## Julkaisu eetteriin

`Julkaise eetteriin` käyttää edelleen autentikoitua ja CSRF-suojattua posts-endpointia. Palvelin validoi sisällön, tekee GitHub-commitin ja palauttaa julkisen osoitteen. Vercel rakentaa Anomancerin Lähetykset automaattisesti. Agentti- ja orkesteripinnat eivät saa kutsua julkaisuoperaatiota.

## Kirjautuminen

Kirjautuminen tapahtuu Lähetyskoneen omassa sovelluskuoressa. Nykyinen host-only `HttpOnly`, `Secure`, `SameSite=Strict` -cookie, 12 tunnin istunto, origin-tarkistus ja sessioon sidottu CSRF-token säilyvät. Salasanaa tai API-avaimia ei tallenneta manifestiin, service workeriin, Cache API:in tai selaimen localStorageen.

## Asennus

Tuetuissa Chromium-pohjaisissa työpöytä- ja Android-selaimissa sovelluksen voi asentaa Lähetyskoneen `Asenna sovellus` -painikkeesta. Muissa selaimissa painike avaa lyhyen asennusohjeen. Asennettu sovellus avautuu omassa standalone-ikkunassaan.

Sovelluskuori voi avautua ilman verkkoa, mutta kirjautuminen, agentit, GitHub-luonnokset, kuvat ja julkaisu tarvitsevat verkkoyhteyden. Käyttöliittymä näyttää yhteystilan eikä esitä offline-tilaa julkaisuvalmiina.

## Julkaisumallit

Oletusmallissa sama Vercel-projekti palvelee julkiset pinnat ja `/lahetyskone`-sovelluksen. Haluttaessa koko paketti voidaan myöhemmin kytkeä erilliseen yksityiseen Vercel-projektiin ja `lahetyskone.anomancer.com`-osoitteeseen: sovellus ja `/api/admin/*` on tällöin pidettävä samalla originilla, ja GitHub-write-token jää vain kyseisen projektin palvelinympäristöön.
