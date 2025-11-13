module.exports = {
    registerFlowActions(homey) {
      // Action: Set Target Temperature Level
      homey.flow.getActionCard('target_temperature_level').registerRunListener(async (args) => {
        const device = args.device;
        homey.log(`Flow Action: Setting target_temperature_level to ${args.level}`);
        await device.onTargetTemperatureLevelChanged(args.level);
        return true;
      });
  
      // Action: Set Heater Mode
      homey.flow.getActionCard('modeHeating').registerRunListener(async (args) => {
        const device = args.device;
        homey.log(`Flow Action: Setting modeHeating to ${args.mode}`);
        await device.onHeatModeChanged(args.level);
        return true;
      });
    }
  };