module.exports = {
  registerCapabilityListeners(device) {
    device.registerCapabilityListener('target_temperature', device.onTargetTemperatureChanged.bind(device));
    device.registerCapabilityListener('target_temperature_level', device.onTargetTemperatureLevelChanged.bind(device));
    device.registerCapabilityListener('light1', device.onLightChanged.bind(device, 1));
    device.registerCapabilityListener('light2', device.onLightChanged.bind(device, 2));
    device.registerCapabilityListener('modeHeating', device.onHeatModeChanged.bind(device));
    device.registerCapabilityListener('blower', device.onBlowerChanged.bind(device));
    device.registerCapabilityListener('button.try_repair', async () => {
      device.log('Attempting to repair the device...');
      try {
        await device.client.reconnect();
        device.log('Reconnect successful');
      } catch (error) {
        device.log('Reconnect failed:', error.message);
      }
    });
  }
};