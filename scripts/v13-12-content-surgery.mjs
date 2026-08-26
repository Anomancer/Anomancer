import fs from 'node:fs';
import path from 'node:path';

const ROOT=process.cwd();

const bodies={
  fi: `Olen seurannut tekoälyn kehitystä jo useamman vuoden, rakentanut omia järjestelmiä, testannut malleja ja yrittänyt ymmärtää, mitä kaiken tämän ympärillä oikeastaan tapahtuu. Matkan varrella tietoa on kertynyt aivan järjetön määrä, mutta iso osa siitä jää helposti teknisen jargonin, markkinointipuheen ja algoritmien nostaman metelin alle.

Siksi tämä sivu on olemassa.

## Lähetykset ovat käännöskerros

Tarkoitus ei ole esitellä jokaista rakentamaani projektia tai dokumentoida jokaista koodiriviä. Paljon kiinnostavampaa on kysyä: **mitä tästä kaikesta voisi olla hyötyä ihmiselle?**

Yhdessä kirjoituksessa voidaan puhua siitä, miksi tekoälyagentille ei kannata antaa rajattomia oikeuksia. Toisessa siitä, miten tunnistaa huono väite. Jossain vaiheessa voidaan purkaa auki algoritmeja, sijoittamisen riskejä, työelämän automaatiota, disinformaatiota, kielen vaikutusta ajatteluun tai sitä, miksi organisaatioiden mittarit alkavat joskus ohjata koko toimintaa väärään suuntaan.

Aiheet voivat näyttää kaukaisilta toisistaan, mutta taustalla pyörii usein sama kysymys: **miten järjestelmä oikeasti toimii, ja mitä siitä seuraa ihmiselle?**

## Kaikkea ei tarvitse osata valmiiksi

Teknologiakeskustelussa on välillä outo oletus, että lukijan pitäisi jo tuntea sanasto ennen kuin hän saa osallistua keskusteluun. Minusta järjestys pitäisi olla päinvastainen: ensin ymmärretään ilmiö, ja vasta sen jälkeen sille annetaan tekninen nimi, jos sellaisesta on hyötyä.

Jos tekoälyagentin käyttöoikeuksista voidaan puhua tavallisella kielellä, puhutaan tavallisella kielellä. Jos jonkin asian ymmärtämiseen tarvitaan kaavio, tehdään kaavio. Monimutkaisuus saa olla olemassa, sitä ei vain tarvitse kaataa kokonaisena lukijan päälle.

## Miksi juuri nyt?

Tekoäly ei enää ole pieni teknologia-aihe muiden joukossa. Se vaikuttaa työhön, mediaan, koulutukseen, ohjelmistoihin, talouteen, luovaan tekemiseen ja siihen, miten tietoa tuotetaan ja levitetään.

Samalla keskustelua ohjaavat voimakkaasti algoritmit, kaupalliset intressit ja jatkuva kilpailu huomiosta. Yhdessä suunnassa tekoäly ratkaisee huomenna kaiken, toisessa koko asia on pelkkä kupla. Todellisuus löytyy yleensä jostain paljon kiinnostavammasta välistä, ja juuri sitä väliä yritän tällä sivulla tutkia.

## Miksi Anomancer?

Anomancer on sisäänkäynti. Se on yksi monista alter egoistani, mutta valitsin juuri sen tähän rooliin, koska nimi kuvaa aika hyvin sitä, mitä teen.

Minua kiinnostavat poikkeamat: kohdat, joissa jokin ei sovi valmiiseen malliin, käyttäytyy odottamattomasti tai paljastaa järjestelmästä jotain, mitä normaalisti ei huomata. Olen itsekin ollut elämässäni usein vähän siinä sivussa, en ihan valmiiden lokeroiden sisällä.

Siksi Anomancer ei tarkoita minulle vain teknologiaa tai tutkimista. Siinä on mukana myös ajatus siitä, ettei poikkeama ole automaattisesti virhe.

Kaikilla ei ole ollut ympäristöä, koulua, työpaikkaa tai ihmisiä ympärillään, jotka olisivat osanneet nähdä juuri heidän tapansa ajatella, oppia tai tehdä asioita vahvuutena. Joskus kyky jää näkymättömäksi vain siksi, että se ilmenee väärässä paikassa tai väärällä tavalla suhteessa siihen, mitä ympäristö osaa odottaa tai palkita.

Haluaisin omalla tekemiselläni myös vähän tökkiä tätä asetelmaa. Asioita voi rakentaa omituisistakin lähtökohdista, eikä oman polun tarvitse näyttää valmiilta uramallilta ollakseen todellinen. Jos joku, joka on joskus kokenut olevansa vääränlainen, myöhässä tai kokonaan ulkopuolella, saa tästä edes vähän lisää uskoa omaan tekemiseensä, sillä on minulle merkitystä.

Ehkä siksi nimi sopii: **tutkin poikkeamia, rakennan niiden ympärille asioita ja olen itsekin yksi niistä.**

## Kuka minä olen?

Olen seurannut tekoälyn kehitystä tiiviisti käytännössä ensimmäisestä suuresta generatiivisen tekoälyn aallosta lähtien. Viimeiset kolme vuotta ovat olleet poikkeuksellisen intensiivisiä. Mallit, työkalut, käyttöliittymät ja koko keskustelu niiden ympärillä ovat muuttuneet välillä kuukausien, välillä viikkojen tahdissa.

Olen seurannut globaalia kehitystä, mutta myös sitä, miltä sama ilmiö näyttää Suomessa. Minua kiinnostaa erityisesti väli teknologian todellisten kykyjen ja siitä käytävän julkisen keskustelun välillä. Siellä liikkuu epätietoa, liioittelua, vähättelyä ja ihan suoraa disinformaatiota. Algoritmit vahvistavat helposti sitä, mikä saa ihmiset reagoimaan, eivät välttämättä sitä, mikä auttaa ymmärtämään mitä oikeasti tapahtuu.

Nämä vuodet ovat olleet myös henkilökohtaisesti todella intensiivisiä ja välillä haastavia. Olen rakentanut, testannut, lukenut, verrannut malleja ja yrittänyt pysyä mukana kehityksessä, joka ei juuri odottele. Se on ollut valtavan kiinnostavaa, mutta välillä myös raskasta. Ehkä juuri siksi minua kiinnostaa yhä enemmän se, miten tästä kaikesta voisi tehdä muille ihmisille ymmärrettävämpää.

Taustaltani olen lähihoitaja ja vammaisohjaaja, ja toiselta koulutukseltani ilmanvaihtoasentaja. Minulla ei siis ole ollut mitään valmista tekoälytutkijan, ohjelmistokehittäjän tai teknologiajohtajan polkua. Olen päätynyt tähän pitkälti tekemällä, tutkimalla ja yhdistelemällä asioita, jotka eivät paperilla välttämättä edes kuulu samaan huoneeseen.

Ehkä se selittää myös tapaani katsoa teknologiaa. Minua kiinnostaa harvoin vain se, miten järjestelmä toimii. Yhtä paljon kiinnostaa, mitä se tekee ihmisille, millaista käyttäytymistä se synnyttää ja mitä tapahtuu, kun tekninen järjestelmä törmää oikeaan maailmaan.

## Entä Observatorio?

ANOMANCER on sisäänkäynti ja Lähetykset ovat ihmiselle luettava kerros. Jos jokin aihe alkaa vetää syvemmälle, Observatorion puolelta löytyy konehuone: järjestelmiä, kokeita, sovelluksia, musiikkia, tutkimusta ja muuta materiaalia.

Kaikkea ei tarvitse nähdä kerralla. Riittää, että löytää yhden asian, josta on oikeasti hyötyä.`,

  en: `I’ve been following AI closely since the first major wave of generative AI started moving into everyday use. Along the way I’ve built my own systems, tested models and tried to understand what is actually happening around the technology, not just what is being said about it.

That has produced an absurd amount of information. Much of it is easy to lose under technical jargon, marketing language and whatever the algorithms happen to amplify that day.

That is why this page exists.

## Dispatches are a translation layer

The point is not to showcase every project I’ve built or document every line of code. A more useful question is: **what can any of this actually do for a person?**

One article might look at why an AI agent should not be given unlimited permissions. Another might examine how to recognize a weak claim. Elsewhere I might write about algorithms, investment risk, automation at work, disinformation, language and thinking, or the way organizational metrics can start steering an entire system in the wrong direction.

Those subjects can look unrelated from the outside, but I often end up asking the same question: **how does this system actually work, and what does it do to people?**

## You do not need the vocabulary first

Technology discussions often carry a strange assumption that you should already know the terminology before you are allowed to understand the subject. I think the order should be reversed: understand the phenomenon first, then give it a technical name if that name is useful.

If AI agent permissions can be explained in ordinary language, I’ll use ordinary language. If something needs a diagram, I’ll make a diagram. Complexity does not need to disappear, but it does not need to be dropped on the reader all at once either.

## Why now?

AI is no longer a small technology topic sitting in its own corner. It affects work, media, education, software, economics, creative practice and the way information is produced and distributed.

At the same time, the public conversation around it is shaped by algorithms, commercial interests and constant competition for attention. In one direction, AI is supposedly going to solve everything tomorrow. In the other, the whole thing is dismissed as a bubble. Reality is usually somewhere in the much more interesting space between those extremes, and that is the space I want to explore here.

## Why Anomancer?

Anomancer is an entrance. It is one of several alter egos I use, but I chose this one for this role because the name describes what I do surprisingly well.

I am interested in anomalies: places where something does not fit the expected model, behaves unexpectedly or reveals something about a system that would otherwise remain hidden. I have also spent a fair amount of my own life slightly outside the usual boxes.

That is why Anomancer is not only a name for technology or research. There is another idea inside it: **an anomaly is not automatically an error.**

Not everyone has had an environment, school, workplace or group of people that knew how to recognize their particular way of thinking, learning or creating as a strength. Sometimes an ability stays invisible simply because it appears in the wrong place, or in a form the surrounding system does not know how to recognize or reward.

Part of what I want to do with my work is push against that. Useful things can come from unusual starting points, and a real path does not have to resemble a ready-made career template. If something I build gives a little more confidence to someone who has felt out of place, late, overlooked or simply wrong for the available boxes, that matters to me.

Maybe that is why the name fits: **I study anomalies, build things around them, and I am one myself.**

## Who am I?

I have followed AI closely since the first major wave of generative AI began breaking into everyday use. The last three years have been unusually intense. Models, tools, interfaces and the conversation around them have sometimes changed in months, sometimes in weeks.

I have followed the global development, but also the way the same phenomenon appears in Finland. I am especially interested in the gap between what the technology can actually do and the way people talk about it. That gap fills quickly with uncertainty, exaggeration, dismissal, bad information and straightforward disinformation. Algorithms make it stranger by rewarding what produces a reaction, not necessarily what helps people understand what is happening.

These years have been intense on a personal level as well. I have spent a huge amount of time building, testing, reading, comparing models and trying to keep up with a field that does not wait around. It has been fascinating, but it has also been difficult at times. That is probably one reason I have become increasingly interested in making all of this easier for other people to understand.

My original background is not in computer science or AI research. I trained as a practical nurse and disability support worker, and I also trained as a ventilation installer. There was no ready-made route from my education into AI systems, language models or software architecture. I mostly ended up here by making things, studying them and connecting areas that do not necessarily look related on paper.

That probably explains something about the way I look at technology too. I am rarely interested only in how a system works. I am just as interested in what it does to people, what kinds of behavior it creates and what happens when a technical system collides with the real world.

## And the Observatory?

ANOMANCER is the entrance and the Dispatches are the human-readable layer. If a subject starts pulling you deeper, the Observatory contains the machinery underneath: systems, experiments, applications, music, research and other material.

You do not need to see all of it at once. Finding one useful thing is enough.`
};

const descriptions={
  fi:'ANOMANCER purkaa tekoälyä, järjestelmiä, mediaa, kieltä ja teknologiaa ymmärrettävään muotoon ja etsii siitä käytännön hyötyä ihmisille.',
  en:'Why does ANOMANCER exist? AI, systems, media, language and technology translated into something people can actually understand and use.'
};

function splitPost(text,file){
  const normalized=text.replace(/\r\n/g,'\n');
  if(!normalized.startsWith('---\n')) throw new Error(`${file}: frontmatter missing`);
  const end=normalized.indexOf('\n---\n',4);
  if(end<0) throw new Error(`${file}: frontmatter not closed`);
  return {head:normalized.slice(4,end).split('\n'),body:normalized.slice(end+5)};
}
function scalar(line,key){
  const prefix=`${key}:`;
  if(!line.startsWith(prefix)) return null;
  let v=line.slice(prefix.length).trim();
  try { return JSON.parse(v); } catch { return v.replace(/^['"]|['"]$/g,''); }
}
function setField(lines,key,value){
  const rendered=`${key}: ${typeof value==='boolean'?String(value):JSON.stringify(value)}`;
  const i=lines.findIndex(line=>line.startsWith(`${key}:`));
  if(i>=0) lines[i]=rendered; else lines.push(rendered);
}
function findArticle(lang){
  const dir=path.join(ROOT,'content',lang);
  for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.md'))){
    const file=path.join(dir,name), text=fs.readFileSync(file,'utf8');
    const {head}=splitPost(text,file);
    const key=head.map(line=>scalar(line,'translationKey')).find(v=>v!==null);
    const slug=head.map(line=>scalar(line,'slug')).find(v=>v!==null);
    if(key==='why-this-page-exists' || slug===(lang==='fi'?'miksi-tama-sivu-on-olemassa':'why-this-page-exists')) return file;
  }
  throw new Error(`Could not find why-this-page-exists article for ${lang}`);
}

for(const lang of ['fi','en']){
  const file=findArticle(lang);
  const {head}=splitPost(fs.readFileSync(file,'utf8'),file);
  setField(head,'category','info-media');
  setField(head,'audience',['all']);
  setField(head,'description',descriptions[lang]);
  setField(head,'translationKey','why-this-page-exists');
  setField(head,'pinned',true);
  setField(head,'draft',false);
  fs.writeFileSync(file,`---\n${head.join('\n')}\n---\n\n${bodies[lang].trim()}\n`);
  console.log(`✓ V13.12 content surgery: ${path.relative(ROOT,file)}`);
}
