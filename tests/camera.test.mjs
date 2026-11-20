import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyWheelBurst, continuesWheelBurst, settleWheelBurst, townFrame, wheelBurstZoomFactor, wheelPixels, wheelZoomFactor } from '../lib/camera.ts';

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
  const wheel = settleWheelBurst(classifyWheelBurst(notch));
  assert.equal(wheel.action, 'wheel');
  const momentum = classifyWheelBurst({ ...notch, deltaY: 12, timeStamp: 120 }, wheel);
  assert.equal(momentum.action, 'wheel');
  assert.equal(classifyWheelBurst({ ...notch, timeStamp: 400 }, momentum).action, 'pending');
  assert.equal(classifyWheelBurst({ ...notch, shiftKey: true }).action, 'pan');
  assert.equal(classifyWheelBurst({ ...sample, deltaMode: 1, deltaY: 3 }).action, 'wheel');
  assert.equal(classifyWheelBurst({ ...sample, deltaMode: 2, deltaY: 1 }).action, 'wheel');
  assert.equal(classifyWheelBurst({ ...sample, ctrlKey: true }).action, 'pinch');
});

test('modifier changes start a new wheel burst without waiting', () => {
  const base = { ctrlKey: false, shiftKey: false, deltaMode: 0, deltaX: 8, deltaY: 10, timeStamp: 0 };
  const pan = classifyWheelBurst(base);
  const pinch = classifyWheelBurst({ ...base, ctrlKey: true, deltaX: 0, timeStamp: 20 }, pan);
  assert.equal(pinch.action, 'pinch', 'pan -> pinch');
  assert.equal(classifyWheelBurst({ ...base, timeStamp: 40 }, pinch).action, 'pan', 'pinch -> pan');

  const notch = settleWheelBurst(classifyWheelBurst({ ...base, deltaX: 0, deltaY: 100, timeStamp: 200 }));
  assert.equal(notch.action, 'wheel');
  assert.equal(classifyWheelBurst({ ...base, deltaX: 0, deltaY: 100, shiftKey: true, timeStamp: 220 }, notch).action, 'pan', 'notch -> shift-pan');
});

test('wheel preference resolves ambiguous mouse and trackpad samples', () => {
  const base = { ctrlKey: false, shiftKey: false, deltaMode: 0, deltaX: 0, timeStamp: 0 };
  const mouseLike = { ...base, deltaY: 40 };
  const trackpadLike = { ...base, deltaY: 60 };

  assert.equal(classifyWheelBurst(mouseLike, undefined, 'zoom').action, 'wheel');
  assert.equal(classifyWheelBurst(trackpadLike, undefined, 'zoom').action, 'wheel');
  assert.equal(classifyWheelBurst(mouseLike, undefined, 'pan').action, 'pan');
  assert.equal(classifyWheelBurst(trackpadLike, undefined, 'pan').action, 'pan');
  assert.equal(classifyWheelBurst(mouseLike, undefined, 'auto').action, 'pending');
  assert.equal(classifyWheelBurst(trackpadLike, undefined, 'auto').action, 'pending');
});

test('auto mode buffers ambiguous starts and locks the chosen action through momentum', () => {
  const base = { ctrlKey: false, shiftKey: false, deltaMode: 0, deltaX: 0, deltaY: 60, timeStamp: 0 };
  const initiallyAmbiguous = classifyWheelBurst(base);
  assert.equal(initiallyAmbiguous.action, 'pending');
  assert.equal(settleWheelBurst(initiallyAmbiguous).action, 'wheel');

  for (const evidence of [{ deltaY: 2.5 }, { deltaX: 1 }]) {
    const detected = classifyWheelBurst({ ...base, ...evidence, timeStamp: 20 }, initiallyAmbiguous);
    assert.equal(detected.action, 'pan');
    assert.equal(detected.deltaY, 60 + (evidence.deltaY ?? 60));
    for (const deltaY of [40, 60]) {
      assert.equal(classifyWheelBurst({ ...base, deltaY, timeStamp: 30 }, detected).action, 'pan');
    }
    assert.equal(classifyWheelBurst({ ...base, timeStamp: 30 }, detected, 'zoom').action, 'wheel');
  }

  const secondSample = classifyWheelBurst({ ...base, deltaY: 30, timeStamp: 20 }, initiallyAmbiguous);
  assert.equal(secondSample.action, 'pending');
  assert.equal(secondSample.deltaY, 90);
  assert.equal(classifyWheelBurst({ ...base, deltaX: 3, timeStamp: 30 }, secondSample).action, 'pan');
  assert.equal(classifyWheelBurst({ ...base, deltaX: 3, timeStamp: 41 }, secondSample).action, 'wheel');
  assert.equal(settleWheelBurst(secondSample).action, 'wheel');
  assert.equal(settleWheelBurst(classifyWheelBurst({ ...base, deltaY: 8 })).action, 'pan');

  const lateEvidence = classifyWheelBurst({ ...base, deltaX: 1, timeStamp: 41 }, initiallyAmbiguous);
  assert.equal(lateEvidence.action, 'wheel', 'the decision window already closed');
});

test('line and page notches override prior trackpad evidence without reloading', () => {
  const trackpad = classifyWheelBurst({ ctrlKey: false, shiftKey: false, deltaMode: 0, deltaX: 3, deltaY: 8, timeStamp: 0 });
  assert.equal(trackpad.action, 'pan');

  const lineNotch = classifyWheelBurst({ ctrlKey: false, shiftKey: false, deltaMode: 1, deltaX: 0, deltaY: 3, timeStamp: 20 }, trackpad);
  assert.equal(lineNotch.action, 'wheel');
  assert.equal(continuesWheelBurst({ ctrlKey: false, shiftKey: false, deltaMode: 1, deltaX: 0, deltaY: 3, timeStamp: 30 }, lineNotch, 'auto'), true);
  assert.equal(classifyWheelBurst({ ctrlKey: true, shiftKey: false, deltaMode: 2, deltaX: 0, deltaY: 1, timeStamp: 30 }, lineNotch).action, 'wheel');
  assert.equal(classifyWheelBurst({ ctrlKey: false, shiftKey: true, deltaMode: 1, deltaX: 0, deltaY: 3, timeStamp: 40 }, lineNotch).action, 'pan');
  assert.equal(classifyWheelBurst({ ctrlKey: false, shiftKey: false, deltaMode: 1, deltaX: 0, deltaY: 3, timeStamp: 40 }, lineNotch, 'pan').action, 'pan');
});

test('wheel steps normalize, accumulate smoothly, reverse exactly and cap large impulses', () => {
  const lineNotch = wheelPixels(3, 1, 800);
  assert.equal(lineNotch, 96);
  assert.ok(wheelZoomFactor(lineNotch, false) > 1.15 && wheelZoomFactor(lineNotch, false) < 1.2);
  assert.ok(Math.abs(wheelZoomFactor(1, false) ** 100 - wheelZoomFactor(100, false)) < 1e-12);
  assert.ok(Math.abs(wheelZoomFactor(4, true) * wheelZoomFactor(-4, true) - 1) < 1e-12);
  assert.equal(wheelZoomFactor(4000, true), Math.exp(.24));
});

test('each buffered wheel notch receives its own zoom cap', () => {
  const sample = { ctrlKey: false, shiftKey: false, deltaMode: 0, deltaX: 0, deltaY: 100, timeStamp: 0 };
  const first = classifyWheelBurst(sample);
  const rapid = settleWheelBurst(classifyWheelBurst({ ...sample, timeStamp: 20 }, first));
  const oneNotch = wheelBurstZoomFactor(settleWheelBurst(first), 800);
  const spaced = oneNotch * wheelBurstZoomFactor(settleWheelBurst(classifyWheelBurst({ ...sample, timeStamp: 200 })), 800);

  assert.equal(wheelBurstZoomFactor(rapid, 800), spaced);
});
