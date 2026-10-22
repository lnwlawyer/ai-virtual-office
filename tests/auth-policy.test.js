import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionAccess,canAccessFeature} from '../src/auth-policy.js';
const project='ai-virtual-office-96157';
test('default deny for absent, wrong-project and unverified sessions',()=>{
  for(const session of [null,{}, {uid:'123',projectId:'landright-admin',claims:{email_verified:true}},{uid:'123',projectId:project,claims:{email_verified:false}}])
    assert.deepEqual(sessionAccess(session,project),{role:'guest',authenticated:false});
});
test('verified session allows personal workspace but never privileged features',()=>{
  const session={uid:'user1',projectId:project,claims:{email_verified:true,admin:true}};
  assert.deepEqual(sessionAccess(session,project),{role:'user',authenticated:true});
  assert.equal(canAccessFeature('personal-workspace',session,project),true);
  for(const feature of ['admin','ai-gateway','document-write'])assert.equal(canAccessFeature(feature,session,project),false);
});
test('public dashboard remains accessible without login',()=>{
  assert.equal(canAccessFeature('public-dashboard',null,project),true);
  assert.equal(canAccessFeature('personal-workspace',null,project),false);
});
