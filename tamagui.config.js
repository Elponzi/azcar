const { config } = require('@tamagui/config/v3');
const { createTamagui } = require('tamagui');

const tamaguiConfig = createTamagui(config);

module.exports = tamaguiConfig;
