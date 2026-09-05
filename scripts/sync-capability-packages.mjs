import {syncCapabilityPackageRegistry} from '../server/capability-package-registry.js';

const result=syncCapabilityPackageRegistry();
console.log(
  `✓ Capability Package Registry: ${result.descriptors.length} pakettia`+
  `${result.changed?' · generated registry päivitetty':' · registry ajan tasalla'}`
);
