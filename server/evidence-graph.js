import { isSourceVerified, stableSourceId } from './content.js';

const MAX_CLAIMS = 40;
const MAX_SOURCES = 40;
const MAX_RELATIONS = 160;

function clean(value, max = 600) {
  return String(value ?? '').trim().slice(0, max);
}

function stableId(prefix, value = '') {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `${prefix}-${(hash >>> 0).toString(36)}`;
}

export function stableClaimId(text = '') {
  return stableId('claim', clean(text, 600));
}

export function classifyClaimVerification(claim = {}, sources = []) {
  const sourceByUrl = new Map((Array.isArray(sources) ? sources : []).map(source => [source.url, source]));
  const evidence = [...new Set((Array.isArray(claim.evidence) ? claim.evidence : []).filter(Boolean))];
  const linkedSources = evidence.map(url => sourceByUrl.get(url)).filter(Boolean);
  const verified = linkedSources.filter(isSourceVerified);
  if (verified.length && claim.status === 'supported') return 'verified';
  if (linkedSources.length) return 'partial';
  return 'unverified';
}

export function buildEvidenceGraph(post = {}) {
  const claims = Array.isArray(post.claims) ? post.claims.slice(0, MAX_CLAIMS) : [];
  const sources = Array.isArray(post.sources) ? post.sources.slice(0, MAX_SOURCES) : [];
  const sourceByUrl = new Map(sources.map(source => [source.url, source]));
  const claimNodes = claims.map(claim => {
    const id = claim.id || stableClaimId(claim.text);
    const evidence = [...new Set((Array.isArray(claim.evidence) ? claim.evidence : []).filter(url => sourceByUrl.has(url)))];
    const linkedSources = evidence.map(url => sourceByUrl.get(url)).filter(Boolean);
    return {
      id,
      type: 'claim',
      status: claim.status || 'open',
      verification: classifyClaimVerification(claim, sources),
      text: clean(claim.text, 600),
      note: clean(claim.note, 800),
      evidence: linkedSources.map(source => source.id || stableSourceId(source.url)),
      contradictions: Array.isArray(claim.contradictions) ? claim.contradictions.slice(0, 8).map(item => clean(item, 600)).filter(Boolean) : [],
    };
  }).filter(node => node.text);

  const sourceNodes = sources.map(source => ({
    id: source.id || stableSourceId(source.url),
    type: 'source',
    title: clean(source.title, 220),
    url: source.url,
    publisher: clean(source.publisher, 160),
    verification: source.verification || 'candidate',
    verified: isSourceVerified(source),
    verifiedBy: clean(source.verifiedBy, 120),
    verifiedAt: clean(source.verifiedAt, 40),
    verificationMethod: clean(source.verificationMethod, 80),
    verificationEvidence: clean(source.verificationEvidence, 800),
    verificationNotes: clean(source.verificationNotes, 800),
  })).filter(node => node.url);

  const relations = [];
  for (const claim of claimNodes) {
    for (const sourceId of claim.evidence.slice(0, 12)) {
      if (relations.length >= MAX_RELATIONS) break;
      relations.push({ type: 'supported-by', from: claim.id, to: sourceId });
    }
  }

  const counts = {
    claims: claimNodes.length,
    sources: sourceNodes.length,
    verifiedClaims: claimNodes.filter(node => node.verification === 'verified').length,
    partialClaims: claimNodes.filter(node => node.verification === 'partial').length,
    unverifiedClaims: claimNodes.filter(node => node.verification === 'unverified').length,
    verifiedSources: sourceNodes.filter(node => node.verified).length,
    candidateSources: sourceNodes.filter(node => node.verification === 'candidate').length,
    rejectedSources: sourceNodes.filter(node => node.verification === 'rejected').length,
    contradictionCount: claimNodes.reduce((sum, node) => sum + node.contradictions.length, 0),
  };

  const publicationReady = claimNodes.every(node => node.status !== 'supported' || node.verification === 'verified')
    && sourceNodes.every(node => node.verification !== 'rejected');

  return {
    version: 'anomancer.evidence-graph/v1',
    publicationReady,
    counts,
    claims: claimNodes,
    sources: sourceNodes,
    relations,
  };
}
