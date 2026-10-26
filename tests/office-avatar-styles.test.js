import test from 'node:test';
import assert from 'node:assert/strict';
import {AVATAR_STYLES,avatarStyle,validAvatarStyle,setAvatarStyle} from '../src/office-avatar-styles.js';
import {STAFF} from '../src/virtual-office-model.js';
test('avatar presets are finite and validated',()=>{
 assert.equal(AVATAR_STYLES.length,4);
 assert.equal(validAvatarStyle('silver'),true);
 assert.equal(validAvatarStyle('url(javascript:bad)'),false);
 assert.equal(avatarStyle('unknown').id,'classic');
});
test('per-staff appearance updates do not mutate other staff',()=>{
 const r=setAvatarStyle({},STAFF[0].id,'warm',STAFF);
 assert.equal(r.ok,true);
 assert.equal(r.styles[STAFF[0].id],'warm');
 assert.equal(r.styles[STAFF[1].id],undefined);
 assert.equal(setAvatarStyle(r.styles,'unknown','warm',STAFF).ok,false);
});
