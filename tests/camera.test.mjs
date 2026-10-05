import { test } from 'node:test';
import assert from 'node:assert/strict';
import { townFrame } from '../lib/camera.ts';

test('town overview fits all ground corners in landscape, tall and mobile canvases', () => {
  for (const [width, depth] of [[24,24], [90,75], [140,120]]) for (const aspect of [2, 1.4, .65, .3]) {
    const f = townFrame(width, depth, aspect);
    for (const x of [-width/2,width/2]) for (const z of [-depth/2,depth/2]) {
      const cameraDepth = f.distance - z * Math.cos(Math.PI/3);
      const tanV = Math.tan(38*Math.PI/360);
      assert.ok(Math.abs(x)/(cameraDepth*tanV*aspect) < 1);
      assert.ok(Math.abs(z*Math.sin(Math.PI/3))/(cameraDepth*tanV) < 1);
    }
  }
});
test('portrait fit increases distance, including empty-town dimensions', () => {
  assert.ok(townFrame(24,24,.3).distance > townFrame(24,24,2).distance);
  assert.ok(Number.isFinite(townFrame(24,24,0).distance));
});
