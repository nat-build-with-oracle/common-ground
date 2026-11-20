import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyWheelBurst, townFrame, wheelPixels, wheelZoomFactor } from '../lib/camera.ts';

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

test('wheel burst classification distinguishes trackpad, mouse wheel and pinch', () => {
  const sample = { ctrlKey: false, shiftKey: false, deltaMode: 0, deltaX: 0, deltaY: 12.4, timeStamp: 0 };
  assert.equal(classifyWheelBurst(sample).action, 'pan');
  const diagonal = classifyWheelBurst({ ...sample, deltaX: 8, deltaY: 10 });
  assert.equal(diagonal.action, 'pan');
  const notch = { ...sample, deltaY: 100 };
  const tail = classifyWheelBurst({ ...notch, timeStamp: 120 }, diagonal);
  assert.equal(tail.action, 'pan');
  const momentum = classifyWheelBurst({ ...notch, timeStamp: 240 }, tail);
  assert.equal(momentum.action, 'pan');
  assert.equal(classifyWheelBurst({ ...notch, timeStamp: 400 }, momentum).action, 'wheel');
  assert.equal(classifyWheelBurst({ ...notch, shiftKey: true }).action, 'pan');
  assert.equal(classifyWheelBurst({ ...sample, deltaMode: 1, deltaY: 3 }).action, 'wheel');
  assert.equal(classifyWheelBurst({ ...sample, deltaMode: 2, deltaY: 1 }).action, 'wheel');
  assert.equal(classifyWheelBurst({ ...sample, ctrlKey: true }).action, 'pinch');
});

test('wheel steps normalize, accumulate smoothly, reverse exactly and cap large impulses', () => {
  const lineNotch = wheelPixels(3, 1, 800);
  assert.equal(lineNotch, 96);
  assert.ok(wheelZoomFactor(lineNotch, false) > 1.15 && wheelZoomFactor(lineNotch, false) < 1.2);
  assert.ok(Math.abs(wheelZoomFactor(1, false) ** 100 - wheelZoomFactor(100, false)) < 1e-12);
  assert.ok(Math.abs(wheelZoomFactor(4, true) * wheelZoomFactor(-4, true) - 1) < 1e-12);
  assert.equal(wheelZoomFactor(4000, true), Math.exp(.24));
});
