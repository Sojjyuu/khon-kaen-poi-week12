import type { ProfilerOnRenderCallback } from 'react';

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
