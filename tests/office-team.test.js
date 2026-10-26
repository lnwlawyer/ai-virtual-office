import test from 'node:test';
import assert from 'node:assert/strict';
import {TEAM_PRESETS,applyTeamStatus,teamStatusSummary} from '../src/office-team.js';
import {initialOfficeLayout} from '../src/office-layout.js';
test('team presets update all seven staff without mutation',()=>{
 const original=initialOfficeLayout();
 assert.equal(TEAM_PRESETS.length,3);
 const changed=applyTeamStatus(original,'walking');
 assert.equal(changed.ok,true);
 assert.deepEqual(teamStatusSummary(changed.layout),{working:0,walking:7,resting:0});
 assert.equal(original[0].status,'working');
 assert.deepEqual(teamStatusSummary(applyTeamStatus(changed.layout,'resting').layout),{working:0,walking:0,resting:7});
});
test('invalid team state is rejected',()=>{
 assert.equal(applyTeamStatus(initialOfficeLayout(),'flying').ok,false);
 assert.equal(applyTeamStatus(null,'working').ok,false);
});
