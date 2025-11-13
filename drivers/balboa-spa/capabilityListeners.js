module.exports = {
  registerCapabilityListeners(device) {
    const capabilities = [
      { name: 'target_temperature', handler: device.onTargetTemperatureChanged },
      { name: 'target_temperature_level', handler: device.onTargetTemperatureLevelChanged },
      { name: 'modeHeating', handler: device.onHeatModeChanged },
      { name: 'blower', handler: device.onBlowerChanged }
    ];

    // Register main capabilities
    capabilities.forEach(({ name, handler }) => {
      device.registerCapabilityListener(name, async (value) => {
        try {
          device.log(`Capability changed: ${name} → ${value}`);
          await handler.call(device, value);
        } catch (error) {
          device.log(`Error handling ${name}: ${error.message}`);
        }
      });
    });

    // Register lights
    [1, 2].forEach(lightId => {
      device.registerCapabilityListener(`light${lightId}`, async (value) => {
        try {
          device.log(`Light ${lightId} changed → ${value}`);
          await device.onLightChanged(lightId, value);
        } catch (error) {
          device.log(`Error handling light${lightId}: ${error.message}`);
        }
      });
    });

    // Register repair button
    device.registerCapabilityListener('button.try_repair', async () => {
      device.log('Attempting to repair the device...');
      try {
        await device.client.reconnect();
        device.log('Reconnect successful');
      } catch (error) {
        device.log(`Reconnect failed: ${error.message}`);
      }
    });
  }
};
