import assert from 'node:assert/strict';
import {normalizeIntent} from '../../core/intent/contracts.js';
import {signalToIntent,normalizeSignal} from '../../core/signal/signal-service.js';
import {previewIntent} from '../../core/intent/intent-service.js';

const signal=normalizeSignal({
  type:'github',
  title:'Qwen local model update',
  summary:'Uusi paikallinen mallijulkaisu kannattaa arvioida Lighthouse-työtä varten.',
  url:'https://github.com/example/repo',
  source:'GitHub',
  tags:['local-ai','qwen']
});
assert.equal(signal.format,'anomancer-signal/v1');
assert.equal(signal.type,'github');
assert.equal(signal.tags.length,2);

const input=signalToIntent(signal);
assert.match(input.text,/Qwen local model update/);
assert.match(input.text,/https:\/\/github\.com\/example\/repo/);

const intent=normalizeIntent({signal});
assert.equal(intent.text,'');
assert.equal(intent.signal.type,'github');

const preview=previewIntent({signal});
assert.equal(preview.taskGraph.format,'anomancer-task-graph/v1');
assert.equal(preview.intent.locale,'fi');
assert.ok(Array.isArray(preview.taskGraph.stages));

console.log('✓ Signal → Intent → Task Graph');
