const { withAndroidManifest, withInfoPlist, withPlugins, AndroidConfig } = require('@expo/config-plugins');

const withAndroidMediaService = (config) => {
  return withAndroidManifest(config, (config) => {
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    
    const serviceName = "com.doublesymmetry.trackplayer.service.MusicService";
    
    if (!mainApplication.service) {
        mainApplication.service = [];
    }

    let service = mainApplication.service.find(
        (s) => s.$['android:name'] === serviceName
    );

    if (!service) {
        service = {
            $: {
                'android:name': serviceName,
                'android:enabled': 'true',
                'android:exported': 'true',
            },
            'intent-filter': [
                {
                    action: [
                        { $: { 'android:name': 'android.media.browse.MediaBrowserService' } }
                    ]
                }
            ]
        };
        mainApplication.service.push(service);
    }

    // Ensure strictly required attributes are present (updates existing service if needed)
    service.$['android:foregroundServiceType'] = 'mediaPlayback';
    service.$['android:exported'] = 'true'; // Ensure exported for media browser

    // Add permissions
    // Android 14+ requires specific foreground service types
    const permissions = [
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
        "android.permission.WAKE_LOCK"
    ];

    permissions.forEach(permission => {
        AndroidConfig.Permissions.addPermission(config.modResults, permission);
    });

    return config;
  });
};

const withIOSBackgroundAudio = (config) => {
    return withInfoPlist(config, (config) => {
        if (!config.modResults.UIBackgroundModes) {
            config.modResults.UIBackgroundModes = [];
        }
        if (!config.modResults.UIBackgroundModes.includes("audio")) {
            config.modResults.UIBackgroundModes.push("audio");
        }
        return config;
    });
};

const withMediaService = (config) => {
    return withPlugins(config, [
        withAndroidMediaService,
        withIOSBackgroundAudio
    ]);
};

module.exports = withMediaService;
