'use strict';

const Homey = require('homey');

module.exports = class MyApp extends Homey.App {
  async onInit() {
    this.log('Balboa-Spa app has been initialized');

    this.devices = []; // Make sure this is initialized
    setInterval(() => {
      this.devices.forEach(device => {
        const isAvailable = device.getAvailable();
        this.log(`${device.getName()} is ${isAvailable ? 'running' : 'stopped'}`);
      });
    }, 60 * 1000); // Every 30 seconds
  }

  registerDevice(device) {
    this.devices.push(device);
  }

  unregisterDevice(device) {
    this.devices = this.devices.filter(d => d !== device);
  }
};