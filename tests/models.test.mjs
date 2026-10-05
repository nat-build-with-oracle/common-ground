import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

test('vendored CC0 cartoon citizens contain native walk/idle/sit/work clips and no external resources',()=>{
  for(const letter of 'abcdefghijklmnopqr') {
    const file=new URL(`../public/models/kenney/character-${letter}.glb`,import.meta.url),b=readFileSync(file);
    assert.equal(b.toString('utf8',0,4),'glTF');
    const gltf=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
    for(const name of ['idle','walk','sit','interact-right']) assert.ok(gltf.animations.some(clip=>clip.name===name),`${letter}: ${name}`);
    assert.ok(gltf.meshes.length<=8,'small draw-call budget');
    for (const image of gltf.images || []) if (image.uri) assert.ok(existsSync(new URL(`../public/models/kenney/${image.uri}`,import.meta.url)), `missing texture ${image.uri}`);
    assert.ok(!gltf.images?.some(image=>image.uri && /^https?:/.test(image.uri)));
  }
  assert.match(readFileSync(new URL('../public/models/kenney/LICENSE.txt',import.meta.url),'utf8'),/Creative Commons Zero, CC0/);
});
