const encoder=new TextEncoder();
const safe=value=>String(value??'').trim();
const slug=value=>safe(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)||'nimeton';
const section=(title,body)=>safe(body)?`## ${title}\n\n${safe(body)}\n\n`:'';
const bullets=items=>items.filter(Boolean).map(item=>`- ${item}`).join('\n');
const sortedChapters=project=>[...(project?.chapters||[])].sort((a,b)=>(Number(a.number)||0)-(Number(b.number)||0));
const languageLabel=value=>value==='en'?'English':'Suomi';
const canonStatusLabel=value=>({candidate:'Ehdokas',accepted:'Hyväksytty',retired:'Poistettu käytöstä'})[value]||safe(value)||'Hyväksytty';

export function manuscriptMarkdown(project={}){
  const p=project.project||{},chapters=sortedChapters(project),title=safe(p.title)||'Nimetön käsikirjoitus';
  const front=[`# ${title}`,'',p.premise?`> ${safe(p.premise).replace(/\n+/g,' ')}`:'',p.genre?`**Genre / muoto:** ${safe(p.genre)}`:'',p.pointOfView?`**Näkökulma:** ${safe(p.pointOfView)}`:'',`**Kieli:** ${languageLabel(p.language)}`].filter(Boolean).join('\n\n');
  const body=chapters.map(chapter=>{
    const heading=`# ${chapter.title?`${Number(chapter.number)||''}. ${safe(chapter.title)}`:`Luku ${Number(chapter.number)||''}`}`.replace(/# \./,'# Luku');
    return `${heading}\n\n${safe(chapter.body)||'*Luku on vielä tyhjä.*'}`;
  }).join('\n\n---\n\n');
  return `${front}${body?`\n\n---\n\n${body}`:''}\n`;
}

export function projectMarkdownFiles(project={}){
  const p=project.project||{},world=project.world||{},plot=project.plot||{},files=[];
  files.push({name:'README.md',content:`# ${safe(p.title)||'Narramancer-projekti'}\n\nYksityisestä Narramancer-työtilasta viety Markdown-projektikansio. Vienti ei julkaise sisältöä verkkoon.\n`});
  files.push({name:'project.md',content:`# Projekti\n\n**Kieli:** ${languageLabel(p.language)}\n\n${section('Premissi',p.premise)}${section('Genre / muoto',p.genre)}${section('Näkökulma',p.pointOfView)}${section('Sävy ja rytmi',p.tone)}${section('Muistiinpanot',p.notes)}`});
  files.push({name:'world.md',content:`# Maailma\n\n${section('Yleiskuva',world.summary)}${section('Säännöt',world.rules)}${section('Paikat',world.locations)}${section('Muistiinpanot',world.notes)}`});
  files.push({name:'plot.md',content:`# Juoni\n\n${section('Juonen ydin',plot.summary)}${section('Beatit / käännekohdat',plot.beats)}${section('Loppu / ratkaisu',plot.ending)}${section('Muistiinpanot',plot.notes)}`});
  for(const [index,char] of (project.characters||[]).entries())files.push({name:`characters/${String(index+1).padStart(3,'0')}-${slug(char.name||char.id)}.md`,content:`# ${safe(char.name)||'Hahmo'}\n\n${section('Rooli',char.role)}${section('Yhteenveto',char.summary)}${section('Tavoite',char.goal)}${section('Ristiriita',char.conflict)}${section('Ääni',char.voice)}${section('Muistiinpanot',char.notes)}`});
  for(const chapter of sortedChapters(project))files.push({name:`chapters/${String(Number(chapter.number)||1).padStart(3,'0')}-${slug(chapter.title||chapter.id)}.md`,content:`# ${safe(chapter.title)||`Luku ${chapter.number}`}\n\n${chapter.summary?`> ${safe(chapter.summary).replace(/\n+/g,' ')}\n\n`:''}${safe(chapter.body)}\n\n${section('Lukumuistiinpanot',chapter.notes)}`});
  const timeline=(project.timeline||[]).map(item=>`## ${safe(item.when)||'Ajankohta avoin'}\n\n${safe(item.event)}${item.chapterRef?`\n\nLuku: \`${safe(item.chapterRef)}\``:''}${item.notes?`\n\n${safe(item.notes)}`:''}`).join('\n\n');
  files.push({name:'timeline.md',content:`# Aikajana\n\n${timeline||'*Ei aikajanan merkintöjä.*'}\n`});
  const canon=(project.canon||[]).map(item=>`- **${canonStatusLabel(item.status)}** ${safe(item.statement)}${item.source?` _(lähde: ${safe(item.source)})_`:''}`).join('\n');
  files.push({name:'canon.md',content:`# Kaanon\n\n${canon||'*Ei kaanonmerkintöjä.*'}\n`});
  files.push({name:'MANUSCRIPT.md',content:manuscriptMarkdown(project)});
  return files;
}

let crcTable=null;
function table(){if(crcTable)return crcTable;crcTable=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);crcTable[n]=c>>>0;}return crcTable;}
function crc32(bytes){let c=0xffffffff,t=table();for(const b of bytes)c=t[(c^b)&0xff]^(c>>>8);return (c^0xffffffff)>>>0;}
function u16(n){return Uint8Array.of(n&255,(n>>>8)&255);}
function u32(n){return Uint8Array.of(n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255);}
function join(parts){const length=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(length);let offset=0;for(const p of parts){out.set(p,offset);offset+=p.length;}return out;}

export function storeZip(files=[]){
  const locals=[],central=[];let offset=0;
  for(const file of files){const name=encoder.encode(String(file.name||'file.txt')),data=encoder.encode(String(file.content??'')),crc=crc32(data);
    const local=join([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data]);
    locals.push(local);
    central.push(join([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]));
    offset+=local.length;
  }
  const centralBytes=join(central),body=join(locals),eocd=join([u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(centralBytes.length),u32(body.length),u16(0)]);
  return join([body,centralBytes,eocd]);
}

export function projectZip(project={}){return storeZip(projectMarkdownFiles(project));}
export function exportBaseName(project={}){return slug(project?.project?.title||'narramancer-project');}
