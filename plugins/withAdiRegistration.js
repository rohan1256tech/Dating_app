const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin that writes the adi-registration.properties file
 * into the Android assets folder during prebuild.
 * Required for Google Play Store package ownership registration.
 */
const withAdiRegistration = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const assetsDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/assets'
      );

      // Ensure the assets directory exists
      fs.mkdirSync(assetsDir, { recursive: true });

      // Write the registration token file
      fs.writeFileSync(
        path.join(assetsDir, 'adi-registration.properties'),
        'C3YUO2KGC7WXQAAAAAAAAAAAAA'
      );

      console.log('✅ adi-registration.properties written to Android assets.');
      return config;
    },
  ]);
};

module.exports = withAdiRegistration;
