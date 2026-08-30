export const publicCoreV3Lang=value=>value==='en'?'en':'fi';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));

const COPY={
  fi:{
    title:'Capability- ja suoritusarkkitehtuuri',
    lead:'Core muodostaa tehtävästä kyvykkyysgraafin ja erottaa lähteet, deterministisen laskennan, mallipäättelyn, ehdotukset ja ihmishyväksynnän toisistaan.',
    packages:'Kyvykkyyspakettia',
    families:'kyvykkyysperhettä',
    compute:'Laskentamoottori',
    graph:'Tehtävägraafi',
    authority:'Lopullinen toimivalta',
    human:'IHMINEN',
    ingress:'Tehtävä',
    match:'Kyvykkyydet',
    trace:'Jälki',
    routeRead:'Luku',
    routeCompute:'Laskenta',
    routeReason:'Päättely',
    routeProposal:'Ehdotus',
    routeApproval:'Hyväksyntä',
    capabilityTitle:'Kyvykkyyskirjasto',
    capabilityLead:'Lista syntyy suoraan asennetuista kyvykkyyspaketeista. Uusi paketti ilmestyy tähän seuraavassa koonnissa ilman käsin ylläpidettävää korttilistaa.',
    ready:'VALMIS',
    runtime:'RUNTIME',
    disabled:'TULOSSA',
    dataEgress:'Datan ulosmeno',
    none:'EI',
    approval:'Ihmisportti',
    yes:'KYLLÄ',
    no:'EI',
    adapter:'Adapteri',
    version:'Versio',
    computeDesc:'Rajattu deterministinen taulukkolaskenta. Ei verkkoyhteyttä, komentotulkkia tai käyttäjän koodin suoritusta.',
    graphDesc:'Riippuvuusgraafi muodostaa topologiset vaiheet ja merkitsee toisistaan riippumattomat haarat rinnakkaisiksi.',
    ensemble:'Monimallikerros',
    ensembleWaiting:'Sopimukset ovat olemassa, mutta rinnakkainen ensemble-runtime ei vielä suorita niitä.',
    boundary:'Julkinen lasiseinä',
    boundaryDesc:'Julkinen Core näyttää rakenteen. Pakettiluvat, raakakontraktit, palveluntarjoaja-asetukset, kehotteet, työtiladata ja oikeiden ajojen sisältö pysyvät yksityisinä.'
  },
  en:{
    title:'Capability and execution architecture',
    lead:'Core turns a task into a capability graph and keeps source reads, deterministic compute, model reasoning, proposals and human approval as separate execution classes.',
    packages:'Capability Packages',
    families:'capability families',
    compute:'Laskentamoottori',
    graph:'Tehtävägraafi',
    authority:'Final authority',
    human:'HUMAN',
    ingress:'Task',
    match:'Capabilities',
    trace:'Trace',
    routeRead:'Read',
    routeCompute:'Compute',
    routeReason:'Reasoning',
    routeProposal:'Proposal',
    routeApproval:'Approval',
    capabilityTitle:'Capability library',
    capabilityLead:'This list is generated directly from installed Capability Packages. A new package appears here on the next build without a manually maintained card list.',
    ready:'READY',
    runtime:'RUNTIME',
    disabled:'COMING',
    dataEgress:'Data egress',
    none:'NO',
    approval:'Human gate',
    yes:'YES',
    no:'NO',
    adapter:'Adapter',
    version:'Version',
    computeDesc:'Bounded deterministic tabular compute. No network, shell or execution of user-supplied code.',
    graphDesc:'The dependency graph creates topological stages and marks independent branches as parallel.',
    ensemble:'Multi-model layer',
    ensembleWaiting:'Contracts exist, but the parallel ensemble runtime does not execute them yet.',
    boundary:'Public glass wall',
    boundaryDesc:'Public Core exposes architecture. Package permissions, raw contracts, provider configuration, prompts, workspace data and real run contents remain private.'
  }
};

const FAMILY={
  source:{fi:'Lähteet',en:'Sources'},
  research:{fi:'Tutkimus',en:'Research'},
  data:{fi:'Data',en:'Data'},
  market:{fi:'Markkinat',en:'Markets'},
  model:{fi:'Monimalli',en:'Multi-model'},
  reasoning:{fi:'Päättely',en:'Reasoning'},
  editorial:{fi:'Toimitus',en:'Editorial'},
  narrative:{fi:'Tarina',en:'Narrative'},
  software:{fi:'Ohjelmisto',en:'Software'},
  trust:{fi:'Luottamus',en:'Trust'},
  tool:{fi:'Työkalut',en:'Tools'},
  context:{fi:'Konteksti',en:'Context'},
  mancer:{fi:'Mancer',en:'Mancer'},
  llm:{fi:'Mallipäättely',en:'Model reasoning'},
  other:{fi:'Muut',en:'Other'}
};

const familyLabel=(id,lang)=>FAMILY[id]?.[lang]||id;
const statusLabel=(status,C)=>status==='ready'?C.ready:status==='runtime'?C.runtime:C.disabled;
const routeLabel=(route,C)=>({
  'read-only':C.routeRead,
  compute:C.routeCompute,
  reasoning:C.routeReason,
  proposal:C.routeProposal,
  approval:C.routeApproval
}[route]||route);

function renderFlow(architecture,C){
  const routes=Array.isArray(architecture?.execution?.routings)?architecture.execution.routings:[];
  const routeNodes=routes.map(route=>`<div class="core-v3-route" data-route="${esc(route)}"><span>${esc(routeLabel(route,C))}</span><code>${esc(route)}</code></div>`).join('');
  return `<div class="core-v3-flow" aria-label="${esc(C.title)}">
    <div class="core-v3-flow-node primary"><span>01</span><strong>${esc(C.ingress)}</strong><small>ProblemModel</small></div>
    <div class="core-v3-flow-arrow" aria-hidden="true">↓</div>
    <div class="core-v3-flow-node"><span>02</span><strong>${esc(C.match)}</strong><small>Capability Registry</small></div>
    <div class="core-v3-flow-arrow" aria-hidden="true">↓</div>
    <div class="core-v3-flow-node"><span>03</span><strong>${esc(C.graph)}</strong><small>${esc(architecture?.taskGraph?.format||'')}</small></div>
    <div class="core-v3-flow-arrow" aria-hidden="true">↓</div>
    <div class="core-v3-routes">${routeNodes}</div>
    <div class="core-v3-flow-arrow" aria-hidden="true">↓</div>
    <div class="core-v3-flow-node"><span>04</span><strong>${esc(C.trace)}</strong><small>Lighthouse Hands</small></div>
    <div class="core-v3-flow-arrow" aria-hidden="true">↓</div>
    <div class="core-v3-flow-node authority"><span>05</span><strong>${esc(C.human)}</strong><small>${esc(C.authority)}</small></div>
  </div>`;
}

function renderArchitecture(architecture,lang,C){
  if(!architecture)return `<p class="core-public-error">Public architecture snapshot unavailable.</p>`;
  const capability=architecture.capabilityPackages||{};
  const compute=architecture.compute||{};
  const graph=architecture.taskGraph||{};
  const ensemble=architecture.ensemble||{};
  return `<div class="core-v3-summary">
    <article><span>${esc(C.packages)}</span><strong>${Number(capability.count)||0}</strong><small>${esc(capability.format||'')}</small></article>
    <article><span>${esc(C.families)}</span><strong>${Array.isArray(capability.families)?capability.families.length:0}</strong><small>${lang==='fi'?'generoitu rekisteri':'generated registry'}</small></article>
    <article><span>${esc(C.compute)}</span><strong>${compute.installed?C.ready:C.disabled}</strong><small>${esc(compute.adapter||'')}</small></article>
    <article><span>${esc(C.authority)}</span><strong>${esc(C.human)}</strong><small>${lang==='fi'?'ulkoiset vaikutukset estetään oletuksena':'external effects fail closed'}</small></article>
  </div>
  ${renderFlow(architecture,C)}
  <div class="core-v3-runtime-grid">
    <article>
      <span>${esc(C.compute)}</span>
      <strong>${esc(compute.adapter||'compute')}</strong>
      <p>${esc(C.computeDesc)}</p>
      <dl>
        <div><dt>CSV / TSV / JSON</dt><dd>${compute.installed?C.ready:C.disabled}</dd></div>
        <div><dt>${esc(C.dataEgress)}</dt><dd>${compute.dataEgress==='none'?C.none:esc(compute.dataEgress||'')}</dd></div>
        <div><dt>max rows</dt><dd>${esc(compute.limits?.rowsPerDataset||'—')}</dd></div>
      </dl>
    </article>
    <article>
      <span>${esc(C.graph)}</span>
      <strong>${esc(graph.format||'')}</strong>
      <p>${esc(C.graphDesc)}</p>
      <dl>
        <div><dt>${lang==='fi'?'riippuvuudet huomioidaan':'dependency aware'}</dt><dd>${graph.dependencyAware?C.yes:C.no}</dd></div>
        <div><dt>${lang==='fi'?'rinnakkaisuusvihjeet':'parallel hints'}</dt><dd>${graph.parallelStageHints?C.yes:C.no}</dd></div>
        <div><dt>${lang==='fi'?'ajoitus':'scheduler'}</dt><dd>${esc(graph.schedulerMode||'—')}</dd></div>
      </dl>
    </article>
    <article>
      <span>${esc(C.ensemble)}</span>
      <strong>${ensemble.status==='declared-not-executable'?C.disabled:C.runtime}</strong>
      <p>${esc(C.ensembleWaiting)}</p>
      <div class="core-v3-code-list">${(ensemble.capabilities||[]).map(item=>`<code>${esc(item.id)}</code>`).join('')}</div>
    </article>
    <article>
      <span>${esc(C.boundary)}</span>
      <strong>ALLOWLIST</strong>
      <p>${esc(C.boundaryDesc)}</p>
      <div class="core-v3-code-list"><code>prompts: private</code><code>workspace: private</code><code>providers: private</code></div>
    </article>
  </div>`;
}

function renderCapabilities(architecture,lang,C){
  const packages=Array.isArray(architecture?.capabilityPackages?.packages)
    ?architecture.capabilityPackages.packages
    :[];
  const groups=new Map();
  for(const item of packages){
    const family=String(item.family||'other');
    if(!groups.has(family))groups.set(family,[]);
    groups.get(family).push(item);
  }
  const familyOrder=(architecture?.capabilityPackages?.families||[]).map(item=>item.id);
  for(const family of groups.keys())if(!familyOrder.includes(family))familyOrder.push(family);

  return `<div class="core-v3-capability-groups">${familyOrder.map(family=>{
    const items=(groups.get(family)||[]).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
    if(!items.length)return '';
    return `<details class="core-v3-capability-family"${['source','data','research','market'].includes(family)?' open':''}>
      <summary><span>${esc(familyLabel(family,lang))}</span><strong>${items.length}</strong></summary>
      <div class="core-v3-capability-grid">${items.map(item=>`
        <article class="core-v3-capability-card" data-routing="${esc(item.routing)}" data-availability="${esc(item.availability)}">
          <div class="core-v3-capability-head">
            <code>${esc(item.id)}</code>
            <span>${esc(statusLabel(item.availability,C))}</span>
          </div>
          <strong>${esc(lang==='fi'?(item.name||item.id):item.id)}</strong>
          ${lang==='fi'&&item.purpose?`<p>${esc(item.purpose)}</p>`:''}
          <dl>
            <div><dt>${esc(C.version)}</dt><dd>${esc(item.version||'—')}</dd></div>
            <div><dt>routing</dt><dd>${esc(routeLabel(item.routing,C))}</dd></div>
            <div><dt>${esc(C.adapter)}</dt><dd>${esc(item.runtimeAdapter||item.adapterKind||'—')}</dd></div>
            <div><dt>${esc(C.dataEgress)}</dt><dd>${esc(item.dataEgress==='none'?C.none:item.dataEgress||'—')}</dd></div>
            <div><dt>${esc(C.approval)}</dt><dd>${item.requiresHumanApproval?C.yes:C.no}</dd></div>
          </dl>
        </article>`).join('')}</div>
    </details>`;
  }).join('')}</div>`;
}

export function renderPublicCoreV3(core,language='fi'){
  const lang=publicCoreV3Lang(language);
  const C=COPY[lang];
  const architecture=core?.architecture||null;
  return {
    architectureHtml:renderArchitecture(architecture,lang,C),
    capabilitiesHtml:renderCapabilities(architecture,lang,C),
    capabilityCount:Number(architecture?.capabilityPackages?.count)||0,
    familyCount:Array.isArray(architecture?.capabilityPackages?.families)
      ?architecture.capabilityPackages.families.length
      :0
  };
}
