import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attachCameraInput } from '../components/office/office.camera-input.ts';

function setup(t) {
  const canvas = new EventTarget(), moves = [];
  canvas.getBoundingClientRect = () => ({ width: 800, height: 600 });
  const input = attachCameraInput(canvas, true, {
    acceptsInput: () => true, mode: () => 'auto', resetAnchor() {},
    wheel: burst => moves.push([burst.action, burst.deltaY]),
    pinch: factor => moves.push(['gesture', factor]),
  });
  t.after(() => input.dispose());
  function emit(type, props) {
    const event = Object.assign(new Event(type, { cancelable: true }), props);
    canvas.dispatchEvent(event);
    return event;
  }
  function wheel(timeStamp, deltaY, ctrlKey = false) {
    const event = new Event('wheel', { cancelable: true });
    Object.defineProperty(event, 'timeStamp', { value: timeStamp });
    Object.assign(event, { deltaY, deltaX: 0, deltaMode: 0, ctrlKey, shiftKey: false });
    canvas.dispatchEvent(event);
    return event;
  }
  return { moves, emit, wheel, input };
}

test('Ctrl+wheel zooms on gesture-capable devices except during a native gesture', t => {
  const { moves, emit, wheel } = setup(t);
  wheel(0, 8, true);
  emit('gesturestart', { scale: 1 });
  assert.ok(wheel(10, 8, true).defaultPrevented);
  emit('gesturechange', { scale: 2 });
  emit('gestureend', { scale: 2 });
  wheel(20, 4, true);
  assert.deepEqual(moves, [['pinch', 8], ['gesture', .5], ['pinch', 4]]);
});

test('district shortcuts and selection changes discard a pending notch and its momentum', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  for (const current of [{ manualAt: 2, selected: null }, { manualAt: 1, selected: 'bot' }]) {
    const { moves, wheel, input } = setup(t);
    wheel(0, 100);
    input.navigationChanged(current, { manualAt: 1, selected: null });
    wheel(20, 12.5);
    t.mock.timers.tick(100);
    assert.deepEqual(moves, []);
    wheel(250, 100);
    t.mock.timers.tick(40);
    assert.deepEqual(moves, [['wheel', 100]]);
  }
});

test('a second integer sample leaves the first decision timer running', t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { moves, wheel } = setup(t);
  wheel(0, 100);
  t.mock.timers.tick(30);
  wheel(30, 100);
  t.mock.timers.tick(9);
  assert.deepEqual(moves, []);
  t.mock.timers.tick(1);
  assert.deepEqual(moves, [['wheel', 200]]);
});
