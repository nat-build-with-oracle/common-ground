import { test } from 'node:test';
import assert from 'node:assert/strict';
import { followSmoothTime, updateFollowTiming } from '../components/office/office.camera-follow.ts';

test('leaving walk mode clears a paused follow before walking resumes', () => {
  const timing = { followPausedUntil: 16_000, walkingSince: 1_000 };

  assert.equal(updateFollowTiming(timing, true, 2_000), true, 'pan has paused follow');
  assert.equal(updateFollowTiming(timing, false, 2_010), false, 'H off clears the pause');
  assert.deepEqual(timing, { followPausedUntil: 0, walkingSince: 0 });
  assert.equal(updateFollowTiming(timing, true, 2_020), false, 'H on follows immediately');
});

test('walking uses manual smoothing during a follow pause and follow smoothing afterward', () => {
  const timing = { followPausedUntil: 16_000, walkingSince: 1_000 };

  assert.equal(followSmoothTime(timing, 2_000, false), .12, 'manual pan during fly-down');
  assert.equal(followSmoothTime(timing, 16_000, false), .18, 'regular follow resumes');
  assert.equal(followSmoothTime(timing, 16_000, true), .55, 'match follow resumes');
});
