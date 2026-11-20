export type FollowTiming = {
  followPausedUntil: number;
  walkingSince: number;
};

/** Keep follow timing consistent across store changes and animation frames. */
export function updateFollowTiming(timing: FollowTiming, following: boolean, now: number) {
  if (!following) {
    timing.followPausedUntil = 0;
    timing.walkingSince = 0;
    return false;
  }
  timing.walkingSince ||= now;
  return now < timing.followPausedUntil;
}

/** Manual camera movement stays responsive until following takes control again. */
export function followSmoothTime(timing: FollowTiming, now: number, match: boolean) {
  if (now < timing.followPausedUntil) return .12;
  if (match) return .55;
  return now - timing.walkingSince < 2_500 ? 1.2 : .18;
}
