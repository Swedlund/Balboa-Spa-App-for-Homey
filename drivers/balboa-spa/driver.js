'use strict';

const Homey = require('homey');
const { discoverDevices } = require('./integration/deviceDiscovery.js');

class MyDriver extends Homey.Driver {

  async onInit() {
    this.log('Balboa-Spa has been initialized');
  }

  async onPairListDevices() {
    try {
      const devices = await discoverDevices();
      return devices.map(device => ({
        name: `Balboa Hot Tub`,
        data: {
          id: device.address,
          mac: device.mac
        }
      }));
    } catch (error) {
      this.log('Error discovering devices:', error);
      return [];
    }
  }

  async onDeleteDevice(device) {
    this.log('Device removed:', device);
  }
}

module.exports = MyDriver;