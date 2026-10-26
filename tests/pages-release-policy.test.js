import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('CI-gated Pages workflow is restricted to successful main push and exact SHA',()=>{
 const w=readFileSync('.github/workflows/pages-ci-gated.yml','utf8');
 for(const required of ['workflow_run:','branches: [main]','conclusion == \'success\'','event == \'push\'','head_repository.full_name == github.repository','workflow_run.head_sha','npm test && npm run build','actions/deploy-pages@v4'])assert.ok(w.includes(required),required);
 assert.ok(!w.includes('VITE_FIREBASE_API_KEY'));
});
test('Vite build uses repo-specific Pages base path',()=>{
 const config=readFileSync('vite.config.js','utf8');
 assert.ok(config.includes('/ai-virtual-office/'));
});
