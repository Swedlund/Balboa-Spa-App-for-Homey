
process.on('uncaughtException', (err) => {
  console.error('Unhandled exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection:', reason);
});


const net = require('net');
const EventEmitter = require('events');
const SpaParser = require('./parser');
const SpaCommandsSet = require('./commandsSet');
const SpaCommandsGet = require('./commandsGet');

class SpaClient extends EventEmitter {
  constructor(hostIp, port = 4257, onSpaUpdate, onSpaLog) {
    super();
    this.hostIp = hostIp;
    this.port = port;
    this.client = null;
    this.parser = new SpaParser();
    this.spaStatus = {};
    this.keepAliveInterval = null;
    this.lastDataReceived = Date.now();
    this.commands = {
      set: new SpaCommandsSet(this),
      get: new SpaCommandsGet(this)
    };

    this.onSpaUpdate = onSpaUpdate;
    this.onSpaLog = onSpaLog;
  }

  log(level, message) {
    const logMessage = `[${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
    if (this.onSpaLog) {
      this.onSpaLog(logMessage);
    }
  }

  logListenerCount(event) {
    if (this.client) {
      const count = this.client.listenerCount(event);
      this.log('info', `Number of listeners for ${event}: ${count}`);
    }
  }

  connect(attempt = 1) {
    return new Promise((resolve, reject) => {
      this.client = new net.Socket();
      this.client.setMaxListeners(50);
      this.client.setKeepAlive(true, 120000);
  
      const timeoutMs = 10000; // 10 sekunder
      const maxAttempts = 10;
  
      const timeout = setTimeout(() => {
        this.log('error', 'Connection attempt timed out');
        this.client.destroy();
        reject(new Error('Connection timeout'));
      }, timeoutMs);
  
      this.client.connect(this.port, this.hostIp, () => {
        clearTimeout(timeout);
        this.log('info', `Connected to spa at ${this.hostIp}:${this.port}`);
        this.emit('connected');
        this.onSpaUpdate({ connectivityAlarm: false });
        resolve();
      });
  
      this.client.on('error', (err) => {
        clearTimeout(timeout);
        this.log('error', `Connection error: ${err.message}`);
        if (attempt < maxAttempts) {
          this.reconnect(attempt + 1);
        } else {
          this.log('error', 'Max reconnect attempts reached');
          this.onSpaUpdate({ connectivityAlarm: true });
        }
      });
  
      this.client.on('data', (data) => {
        this.lastDataReceived = Date.now();
        this.handleData(data);
      });
  
      this.client.on('close', () => {
        this.log('info', 'Connection closed');
        this.emit('disconnected');
        clearInterval(this.keepAliveInterval);
        if (attempt < maxAttempts) {
          this.reconnect(attempt + 1);
        } else {
          this.log('error', 'Max reconnect attempts reached after close');
          this.onSpaUpdate({ connectivityAlarm: true });
        }
      });
  
      // Kontrollera om data uteblir
      this.keepAliveInterval = setInterval(() => {
        const now = Date.now();
        if (now - this.lastDataReceived > 120000) {
          this.log('warning', 'No data received for 2 minutes, reconnecting...');
          if (attempt < maxAttempts) {
            this.reconnect(attempt + 1);
          } else {
            this.log('error', 'Max reconnect attempts reached due to inactivity');
            this.onSpaUpdate({ connectivityAlarm: true });
          }
        }
      }, 120000);
    });  
  }
  
  disconnect() {
    if (this.client) {
      this.client.removeAllListeners('data');
      this.client.removeAllListeners('error');
      this.client.removeAllListeners('close');
      this.client.destroy();
      this.client = null;
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
      this.emit('disconnected');

      this.log('info', 'Disconnected from spa and cleaned up resources');
      this.logListenerCount('data');
    }
  }

  reconnect(attempt = 1) {
    if (attempt > 10) {
      this.log('error', 'Max reconnect attempts reached. Giving up.');
      this.onSpaUpdate({ connectivityAlarm: true });
      return;
    }
    this.disconnect();
    const delay = Math.min(30000, 5000 * attempt);
    setTimeout(() => {
      this.log('info', `Attempting to reconnect (attempt ${attempt})...`);
      this.connect().catch(err => {
        this.log('error', `Reconnection failed: ${err.message}`);
        this.reconnect(attempt + 1);
      });
    }, delay);
  }

  handleData(data) {
    process.nextTick(() => {
      const responseType = this.parser.identifyResponseType(data);
      if (responseType === 'status_update') {
        const parsedData = this.parser.parseStatusUpdate(data);
        if (JSON.stringify(this.spaStatus) !== JSON.stringify(parsedData)) {
          this.spaStatus = { ...parsedData };
          this.onSpaUpdate(this.spaStatus);
        }
      }
    });
  }

  computeChecksum(length, payload) {
    let crc = 0xb5;
    for (let cur = 0; cur < length; cur++) {
      for (let i = 0; i < 8; i++) {
        const bit = crc & 0x80;
        crc = ((crc << 1) & 0xff) | ((payload[cur] >> (7 - i)) & 0x01);
        if (bit) {
          crc ^= 0x07;
        }
      }
      crc &= 0xff;
    }
    for (let i = 0; i < 8; i++) {
      const bit = crc & 0x80;
      crc = (crc << 1) & 0xff;
      if (bit) {
        crc ^= 0x07;
      }
    }
    return crc ^ 0x02;
  }

  sendMessage(type, payload) {
    const length = 5 + payload.length;
    const checksum = this.computeChecksum(length - 1, Buffer.concat([Buffer.from([length]), type, payload]));
    const prefix = Buffer.from([0x7e]);
    const message = Buffer.concat([prefix, Buffer.from([length]), type, payload, Buffer.from([checksum]), prefix]);

    try {
      this.client.write(message);
      return true;
    } catch (e) {
      this.log('error', `Failed to send message: ${e.message}`);
      this.reconnect();
      return false;
    }
  }

  parseChunk(chunk) {
    const responseType = this.parser.identifyResponseType(chunk);
    let parsedData = null;
    switch (responseType) {
      case 'status_update':
        parsedData = this.parser.parseStatusUpdate(chunk);
        break;
      case 'filter_cycles_response':
        parsedData = this.parser.parseFilterCyclesResponse(chunk);
        this.log('info', 'Parsed filter cycles response:', parsedData);
        break;
      case 'information_response':
        parsedData = this.parser.parseInformationResponse(chunk);
        this.log('info', 'Parsed information response:', parsedData);
        break;
      case 'additional_information_response':
        parsedData = this.parser.parseAdditionalInformationResponse(chunk);
        this.log('info', 'Parsed additional information response:', parsedData);
        break;
      case 'preferences_response':
        parsedData = this.parser.parsePreferencesResponse(chunk);
        this.log('info', 'Parsed preferences response:', parsedData);
        break;
      case 'fault_log_response':
        parsedData = this.parser.parseFaultLogResponse(chunk);
        this.log('info', 'Parsed fault log response:', parsedData);
        break;
      case 'gfci_test_response':
        parsedData = this.parser.parseGfciTestResponse(chunk);
        this.log('info', 'Parsed GFCI test response:', parsedData);
        break;
      case 'configuration_response':
        parsedData = this.parser.parseConfigurationResponse(chunk);
        this.log('info', 'Parsed configuration response:', parsedData);
        break;
      case 'module_identification_response':
        parsedData = this.parser.parseModuleIdentificationResponse(chunk);
        this.log('info', 'Parsed module identification response:', parsedData);
        break;
      default:
        this.log('warning', 'Unknown response type:', responseType);
        break;
    }
    if (JSON.stringify(this.spaStatus) !== JSON.stringify(parsedData)) {
      this.spaStatus = { ...parsedData };
      this.onSpaUpdate(parsedData);
    }
  }

  readMsg() {
    this.client.once('data', lenChunk => {
      if (lenChunk.toString() === '~' || lenChunk.length === 0) {
        this.log('warning', 'Invalid length chunk received:', lenChunk);
        return;
      }

      const length = lenChunk[1];
      if (length === 0) {
        this.log('warning', 'Zero length message received');
        return;
      }

      this.client.once('data', chunk => {
        if (chunk !== this.statusChunkArray) {
          this.parseChunk(chunk);
        }
      });
    });
  }

}

module.exports = SpaClient;