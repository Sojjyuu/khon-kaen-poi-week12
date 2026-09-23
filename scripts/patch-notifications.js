const fs = require('fs');
const path = require('path');

const expoNotificationsDir = path.join(__dirname, '..', 'node_modules', 'expo-notifications');

// 1. Patch warnOfExpoGoPushUsage so it logs a warning instead of throwing fatal Error
const warnFiles = [
  path.join(expoNotificationsDir, 'build', 'warnOfExpoGoPushUsage.js'),
  path.join(expoNotificationsDir, 'src', 'warnOfExpoGoPushUsage.ts'),
];

warnFiles.forEach((filePath) => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('throw new Error(message);')) {
      content = content.replace(
        'throw new Error(message);',
        'didWarn = true; console.warn(message);'
      );
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[patch-notifications] Patched ${path.basename(filePath)}`);
    }
  }
});

// 2. Patch native modules that were removed from Expo Go in SDK 53+ to use requireOptionalNativeModule with fallbacks
const patches = [
  {
    file: path.join(expoNotificationsDir, 'build', 'TopicSubscriptionModule.android.js'),
    content: `import { requireOptionalNativeModule } from 'expo-modules-core';

const fallback = {
  addListener: () => {},
  removeListeners: () => {},
  subscribeToTopicAsync: () => Promise.resolve(null),
  unsubscribeFromTopicAsync: () => Promise.resolve(null),
};

export default requireOptionalNativeModule('ExpoTopicSubscriptionModule') ?? fallback;
`,
  },
  {
    file: path.join(expoNotificationsDir, 'build', 'PushTokenManager.native.js'),
    content: `import { requireOptionalNativeModule } from 'expo-modules-core';

const fallback = {
  addListener: () => ({ remove: () => {} }),
  removeListener: () => {},
  removeAllListeners: () => {},
  emit: () => {},
  listenerCount: () => 0,
};

export default requireOptionalNativeModule('ExpoPushTokenManager') ?? fallback;
`,
  },
  {
    file: path.join(expoNotificationsDir, 'build', 'ServerRegistrationModule.native.js'),
    content: `import { requireOptionalNativeModule } from 'expo-modules-core';

const fallback = {
  addListener: () => {},
  removeListeners: () => {},
};

export default requireOptionalNativeModule('NotificationsServerRegistrationModule') ?? fallback;
`,
  },
  {
    file: path.join(expoNotificationsDir, 'build', 'BackgroundNotificationTasksModule.native.js'),
    content: `import { requireOptionalNativeModule } from 'expo-modules-core';

const fallback = {
  async registerTaskAsync(taskName) { return null; },
  async unregisterTaskAsync(taskName) { return null; },
};

export default requireOptionalNativeModule('ExpoBackgroundNotificationTasksModule') ?? fallback;
`,
  },
];

patches.forEach(({ file, content }) => {
  if (fs.existsSync(file)) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`[patch-notifications] Patched ${path.basename(file)}`);
  }
});
