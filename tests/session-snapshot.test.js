import test from 'node:test';
import assert from 'node:assert/strict';
import {toSessionSnapshot} from '../src/session-snapshot.js';
import {sessionAccess} from '../src/auth-policy.js';
const project='ai-virtual-office-96157';
test('verified Firebase user snapshot matches access policy',()=>{
  const snapshot=toSessionSnapshot({uid:'test-uid',email:'a@example.com',emailVerified:true},project);
  assert.deepEqual(sessionAccess(snapshot,project),{role:'user',authenticated:true});
  assert.deepEqual(sessionAccess(snapshot,'landright-admin'),{role:'guest',authenticated:false});
});
test('unverified users and missing sessions remain guest',()=>{
  assert.equal(toSessionSnapshot(null,project),null);
  assert.deepEqual(sessionAccess(toSessionSnapshot({uid:'test-uid',emailVerified:false},project),project),{role:'guest',authenticated:false});
});
test('browser role claims never elevate privilege',()=>{
  const snapshot=toSessionSnapshot({uid:'test-uid',emailVerified:true,admin:true},project);
  assert.equal(sessionAccess(snapshot,project).role,'user');
});
