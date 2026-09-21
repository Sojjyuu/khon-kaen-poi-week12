type ExpoPlugin = string | [string, Record<string, unknown>];
type ConfigContext = {
  config: { plugins?: ExpoPlugin[]; [key: string]: unknown };
};
declare const process: { env: Record<string, string | undefined> };

export default ({ config }: ConfigContext) => {
  const androidMapsApiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
  const isProductionBuild = process.env.EAS_BUILD_PROFILE === 'production';

  if (isProductionBuild && !androidMapsApiKey) {
    throw new Error(
      'Production build ต้องกำหนด GOOGLE_MAPS_ANDROID_API_KEY ใน EAS Environment Variables',
    );
  }

  return {
    ...config,
    name: 'Khon Kaen Dino Explorer',
    slug: 'khon-kaen-poi',
    scheme: 'khonkaen',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/khon-kaen-dino-icon.png',
    userInterfaceStyle: 'light',
    plugins: [
      ...(config.plugins ?? []),
      'expo-router',
      'expo-notifications',
      [
        'expo-splash-screen',
        {
          image: './assets/khon-kaen-dino-icon.png',
          resizeMode: 'contain',
          backgroundColor: '#071A35',
        },
      ],
    ],
    ios: {
      icon: './assets/khon-kaen-dino-icon.png',
      supportsTablet: true,
      bundleIdentifier: 'com.sojjyu.khonkaenpoi',
    },
    android: {
      package: 'com.sojjyu.khonkaenpoi',
      predictiveBackGestureEnabled: false,
      adaptiveIcon: {
        foregroundImage: './assets/khon-kaen-dino-icon.png',
        backgroundColor: '#071A35',
      },
      ...(androidMapsApiKey
        ? {
            config: {
              googleMaps: {
                apiKey: androidMapsApiKey,
              },
            },
          }
        : {}),
    },
    web: {
      favicon: './assets/khon-kaen-dino-favicon.png',
    },
  };
};
