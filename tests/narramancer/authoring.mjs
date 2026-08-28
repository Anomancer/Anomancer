import assert from 'node:assert/strict';
import fs from 'node:fs';
import { NARRAMANCER_TEMPLATE_ID, getWorkspaceTemplate } from '../../server/workspace-templates.js';
import { manuscriptMarkdown, projectMarkdownFiles } from '../../narramancer-export.js';
import { readAdminCss } from '../../scripts/read-admin-css.mjs';

let passed=0;
async function test(name,fn){await fn();passed++;console.log(`✓ ${name}`);}
const read=file=>fs.readFileSync(file,'utf8');
const js=read('admin-narramancer.js');
const html=read('admin.html');
const css=readAdminCss();
const serverProject=read('server/narramancer-project.js');

await test('projektin kieli on näkyvä template-ohjattu valinta',()=>{
  const projectSection=getWorkspaceTemplate(NARRAMANCER_TEMPLATE_ID).editorDefinition.sections.find(x=>x.id==='project');
  const language=projectSection.fields.find(x=>x.path==='project.language');
  assert.equal(language.type,'select');
  assert.deepEqual(language.options,[{value:'fi',label:'Suomi'},{value:'en',label:'English'}]);
  assert.match(serverProject,/language:project\.language==='en'\?'en':'fi'/);
});

await test('lukujen ja kaanonin kone-enumit saavat suomalaiset käyttöliittymälabelit',()=>{
  assert.match(js,/idea:'Idea',draft:'Luonnos',revised:'Tarkistettu',locked:'Lukittu'/);
  assert.match(js,/candidate:'Ehdokas',accepted:'Hyväksytty',retired:'Poistettu käytöstä'/);
  assert.match(js,/Object\.entries\(CHAPTER_STATUS_LABELS\)/);
  assert.match(js,/Object\.entries\(CANON_STATUS_LABELS\)/);
});

await test('poisto on kumottavissa 10 sekunnin ajan ilman selain-confirmia',()=>{
  assert.match(html,/id="narramancerUndo"/);
  assert.match(html,/id="narramancerUndoBtn"/);
  assert.match(js,/function showUndo\(/);
  assert.match(js,/setTimeout\(\(\)=>\{undoState=null;if\(bar\)bar\.hidden=true;\},10000\)/);
  assert.match(js,/function undoDelete\(/);
  assert.match(css,/\.narramancer-undo/);
});

await test('lukujen järjestystä voi muuttaa ilman käsin numeroitavaa massakorjausta',()=>{
  assert.match(js,/data-chapter-move="-1"/);
  assert.match(js,/data-chapter-move="1"/);
  assert.match(js,/function moveChapter\(delta\)/);
  assert.match(js,/chapter\.number=i\+1/);
});

await test('projektin ja aktiivisen luvun nimi päivittyvät selaimen titleen ja tallentamaton tila näkyy',()=>{
  assert.match(js,/function refreshDocumentTitle\(\)/);
  assert.match(js,/chapterTitle/);
  assert.match(js,/document\.title=`\$\{dirty\(\)\?'• ':''\}/);
  assert.match(js,/Romancer · Anomancer Core/);
});

await test('orkesteriehdotus näyttää muutokset ennen ihmisen soveltamista',()=>{
  assert.match(js,/function diffProject\(/);
  assert.match(js,/function renderProposalDiff\(/);
  assert.match(js,/Nykyinen tallennettu projekti ei muutu ennen ihmisen klikkausta/);
  assert.match(js,/Siirrä tarkistettu ehdotus työtilaan/);
  assert.match(js,/<details class="narramancer-technical">/);
  assert.match(css,/\.narramancer-diff-list article/);
});

await test('kieli kulkee myös Markdown-vientiin ja tilat näkyvät ihmislabelina',()=>{
  const sample={project:{title:'Testi',language:'en'},chapters:[],canon:[{statement:'A on tosi.',status:'candidate'}]};
  assert.match(manuscriptMarkdown(sample),/\*\*Kieli:\*\* English/);
  const files=projectMarkdownFiles(sample);
  assert.match(files.find(x=>x.name==='project.md').content,/\*\*Kieli:\*\* English/);
  assert.match(files.find(x=>x.name==='canon.md').content,/\*\*Ehdokas\*\*/);
});

console.log(`\n${passed}/7 NARRAMANCER AUTHORING MATURITY 16.8.2 -testiä läpi.`);
