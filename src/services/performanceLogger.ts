import type { ProfilerOnRenderCallback } from 'react';

// Development-only evidence for the Week 12 profiler comparison.
export const logRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
) => {
  if (__DEV__) {
    console.info(
      `[PROFILE] ${id} ${phase} actual=${actualDuration.toFixed(2)}ms base=${baseDuration.toFixed(2)}ms`,
    );
  }
};
