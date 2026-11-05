import test from 'node:test';
import assert from 'node:assert/strict';
import {buildBridgeStatus} from '../local-bridge/status.js';
import {validateBridgeStatusSnapshot} from '../src/bridge-status-snapshot.js';
test('accepts bridge snapshot and strips untrusted extra fields',()=>{
 const data=buildBridgeStatus(new Map());
 data.secret='do not show';
 const result=validateBridgeStatusSnapshot(data);
 assert.equal(result.ok,true);
 assert.equal(result.value.secret,undefined);
 assert.equal(result.value.agents.length,7);
});
test('rejects false online device status and inconsistent counts',()=>{
 const data=buildBridgeStatus(new Map());
 data.connectedDevices=1;
 assert.equal(validateBridgeStatusSnapshot(data).ok,false);
 data.connectedDevices=0;
 data.totals.all=1;
 assert.equal(validateBridgeStatusSnapshot(data).ok,false);
});
