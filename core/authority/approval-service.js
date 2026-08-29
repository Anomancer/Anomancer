export const AUTHORITY_DECISION_FORMAT='anomancer-authority-decision/v1';

export function authorityForIntent({profile={},capabilities={}}={}){
  const externalActionRequested=profile.externalActionRequested===true;
  const unresolved=Array.isArray(capabilities.unresolved)?capabilities.unresolved:[];

  return {
    format:AUTHORITY_DECISION_FORMAT,
    finalAuthority:'human',
    startRequiresHuman:true,
    externalActionRequested,
    externalEffectsAllowed:false,
    modelMaySuggest:true,
    modelMayExecuteExternalSideEffects:false,
    dataEgressOnStart:true,
    blockedCapabilities:unresolved.map(item=>item.id),
    note:externalActionRequested
      ?'Lighthouse voi valmistella ja arvioida ulkoista toimintoa, mutta ei suorita sitä itsenäisesti.'
      :'Käynnistäminen on käyttäjän nimenomainen päätös. Lighthouse ei tee itsenäisiä ulkoisia sivuvaikutuksia.'
  };
}
