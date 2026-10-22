import test from 'node:test';
import assert from 'node:assert/strict';
import {firebaseAuthConfig,providerStatus,validateGatewayUrl,PROVIDER_IDS} from '../src/integrations.js';
test('auth remains disabled without explicit Firebase config',()=>{
  assert.equal(firebaseAuthConfig({}),null);
  assert.equal(firebaseAuthConfig({VITE_FIREBASE_PROJECT_ID:'landright-admin'}),null);
});
test('auth config requires a matching Firebase Auth domain',()=>{
  const config={VITE_FIREBASE_API_KEY:'public-browser-config',VITE_FIREBASE_PROJECT_ID:'ai-virtual-office-96157',VITE_FIREBASE_AUTH_DOMAIN:'ai-virtual-office-96157.firebaseapp.com',VITE_FIREBASE_APP_ID:'app-id'};
  assert.equal(firebaseAuthConfig(config).projectId,'ai-virtual-office-96157');
  assert.equal(firebaseAuthConfig({...config,VITE_FIREBASE_AUTH_DOMAIN:'attacker.example'}),null);
});
test('provider adapters cannot issue requests or expose secrets',()=>{
  assert.deepEqual(PROVIDER_IDS,['openai','gemini','claude']);
  assert.equal(providerStatus({OPENAI_API_KEY:'secret'}).every(p=>p.status==='not-connected'),true);
});
test('gateway URL requires HTTPS and exact endpoint',()=>{
  assert.equal(validateGatewayUrl('https://api.example.org/api/ai'),'https://api.example.org/api/ai');
  for(const value of ['http://api.example.org/api/ai','https://user:pass@api.example.org/api/ai','https://api.example.org/other','https://api.example.org/api/ai?key=secret'])assert.equal(validateGatewayUrl(value),null);
});
