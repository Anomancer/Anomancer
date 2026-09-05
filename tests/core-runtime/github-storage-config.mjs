import assert from 'node:assert/strict';
import { contentStoreMode } from '../../server/content-store.js';
import { stateBackendMode } from '../../server/state-backend.js';

for(const key of ['BLOB_READ_WRITE_TOKEN','BLOB_STORE_ID','VERCEL_OIDC_TOKEN','ANOMANCER_STATE_BLOB_TOKEN','ANOMANCER_STATE_BLOB_STORE_ID','ANOMANCER_CONTENT_BLOB_TOKEN','ANOMANCER_CONTENT_BLOB_STORE_ID'])delete process.env[key];
process.env.ANOMANCER_CONTENT_STORE='github';
process.env.ANOMANCER_STATE_STORE='github';
assert.equal(contentStoreMode(),'unconfigured');
assert.equal(stateBackendMode(),'unconfigured');
process.env.GITHUB_TOKEN='test';
process.env.GITHUB_OWNER='owner';
process.env.GITHUB_REPO='repo';
process.env.GITHUB_BRANCH='master';
assert.equal(contentStoreMode(),'github');
assert.equal(stateBackendMode(),'github');
console.log('github storage configuration: ok');
