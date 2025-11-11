'use strict';

const Homey = require('homey');
const SpaClient = require('./integration/communication');
const { registerCapabilityListeners } = require('./capabilityListeners');
const { updateCapabilities } = require('./capabilityUpdater');
const utils = require('./utils');

class BalboaSpa extends Homey.Device {
  async onInit() {
    this.log(`BalboaSpa initialized: Name - ${this.getName()}, Class - ${this.getClass()}`);
    this.client = new SpaClient(this.getData().id, 4257, this.onSpaUpdate.bind(this), this.onSpaLog.bind(this));
    await this.client.connect();
    registerCapabilityListeners(this);
    this.tempHistory = [];
    this.heatingTimes = this.homey.settings.get('heatingTimes') || [];
  
    this.updateSettings();
  
    this.homey.app.registerDevice(this);
  }

  async onSpaUpdate(data) {
    this.log('Spa status updated:', data); 
    updateCapabilities(this, data);
    this.tempHistory = utils.logRecentValues(this.tempHistory, data.currentTemp);
    this.updateSettings();
  }

  async onSpaLog(message) {
    await utils.logToTimeline(this.homey, message);
  }
  
  async onDeleted() {
    console.log('Device is being removed');
    await this.client.disconnect();
  
    this.homey.app.unregisterDevice(this);
  }

  async onLightChanged(lightNum, value) {
    console.log(`Light changed: ${lightNum}, Value: ${value}`);
    await this.client.commands.set.light(lightNum, value);
  }

  async onBlowerChanged(value) {
    console.log(`Blower changed: ${value}`);
    await this.client.commands.set.blower(value);
  }

  async onHeatModeChanged(value) {
    console.log(`Heat mode changed: ${value}`);
    await this.client.commands.set.heatMode(value);
  }

  async onTargetTemperatureChanged(value) {
    console.log(`Target temperature changed: ${value}`);
    await this.client.commands.set.temperature(value);
  }

  async onTargetTemperatureLevelChanged(value) {
    if (this.client.spaStatus.tempRange !== value) {
      console.log(`Target temperature level changed: ${value}`);
      await this.client.commands.set.tempRange(value);
      this.checkTemperature = utils.startHeatingMeasurement(this, this.client.spaStatus.currentTemp, this.client.spaStatus.setTemp);
    } else {
      console.log(`Target temperature level is already set to: ${value}`);
    }
  }

  async onSettings({ oldSettings, newSettings, changedKeys }) {
    console.log('Settings changed:', { oldSettings, newSettings, changedKeys });

    for (const key of changedKeys) {
      switch (key) {
        case 'sync_time':
          if (newSettings.sync_time === 'sync') {
            const time = utils.getCurrentTime(this.homey);
            await this.client.commands.set.currentTime(time.hours, time.minutes);
            console.log('Time synced');
            setTimeout(() => this.setSettings({ sync_time: "no_sync" }), 0);
          }
          break;
        default:
          if (key.startsWith('show_pump_')) {
            const pumpNumber = key.split('_')[2];
            this.setPumpVisibility(`pump${pumpNumber}`, newSettings[key]);
          }
          break;
      }
    }
  }

  updateSettings() {
    if (this.client.spaStatus) {
      this.setSettings({
        ip_address: this.getData().id, 
        mac_address: this.getData().mac,
        time: utils.formatTime(this.client.spaStatus.hour, this.client.spaStatus.minute),
        time_scale: this.client.spaStatus.timeScale
      });
    }
  }

  async setPumpVisibility(sensorId, Enable) {
    console.log(`Updating UI Button: ${sensorId}, Enabled: ${Enable}`);

    if (!this.hasCapability(sensorId)) {
      console.log(`Capability ${sensorId} does not exist.`);
      return;
    }

    try {
      const options = Enable ? { "uiComponent": "enum" } : { "uiComponent": null };
      await this.setCapabilityOptions(sensorId, options);
    } catch (error) {
      console.log(`Error setting capability options for ${sensorId}: ${error.message}`);
    }
  }
}

module.exports = BalboaSpa;