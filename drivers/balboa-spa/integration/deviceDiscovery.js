'use strict';

const dgram = require('dgram');

async function discoverDevices() {
  return new Promise((resolve, reject) => {
    const message = Buffer.from('Discovery: Who is out there?\r\n');

    const client = dgram.createSocket('udp4');
    const devices = [];

    client.on('message', (msg, rinfo) => {
      console.log('Received message:', msg.toString(), rinfo);
      const lines = msg.toString().split('\r\n').map(line => line.trim()).filter(line => line);
      console.log('Parsed lines:', lines);

      if (lines.length >= 2 && lines[0] === 'BWGSPA') {
        const mac = extractAndValidateMac(lines[1]);
        if (mac) {
          const device = {
            name: lines[0],
            address: rinfo.address,
            mac: mac,
            data: {
              id: rinfo.address
            }
          };
          console.log('Adding device:', device);
          devices.push(device);
        } else {
          console.log('Invalid MAC address:', lines[1]);
        }
      } else {
        console.log('Unknown device found:', lines);
      }
    });

    client.on('error', (err) => {
      console.log('Client error:', err);
      reject(err);
    });

    client.bind(() => {
      client.setBroadcast(true);
      console.log('Sending discovery message');
      client.send(message, 0, message.length, 30303, '255.255.255.255', (err) => {
        if (err) {
          console.log('Send error:', err);
          reject(err);
        } else {
          setTimeout(() => {
            console.log('Discovery complete, resolving with devices:', devices);
            client.close();
            resolve(devices);
          }, 5000);
        }
      });
    });
  });
}

function extractAndValidateMac(mac) {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac) ? mac : null;
}

module.exports = {
  discoverDevices
};