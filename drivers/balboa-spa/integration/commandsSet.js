class SpaCommandsSet {
    constructor(client) {
        this.client = client;
    }

    async blower(value) {
        try {
            if (this.client.spaStatus.blower === value) {
                return;
            }
            this.sendToggleMessage(0x0c);
        } catch (error) {
            console.error('Error setting blower:', error);
        }
    }

    async currentTime(hour, minute) {
        try {
            console.log(`New time: ${hour}:${minute}`);
            console.log(`Time scale: ${this.client.spaStatus.timeScale}`);
    
            const is24Hour = this.client.spaStatus.timeScale === "24 Hr";
            const encodedHour = is24Hour ? 128 + hour : (hour % 12 || 12);
            console.log(`Sending ${is24Hour ? '24-hour' : '12-hour'} time: ${encodedHour}:${minute}`);
    
            this.client.sendMessage(Buffer.from([0x0a, 0xbf, 0x21]), Buffer.from([encodedHour, minute]));
        } catch (error) {
            console.error('Error setting current time:', error);
        }
    }
    
    async filterCycleBeginsTime(filterNum, value) {
        try {
            if (filterNum === 1) {
                this.client.filter1BeginsHour = value.hour;
                this.client.filter1BeginsMinute = value.minute;
            } else if (filterNum === 2) {
                this.client.filter2BeginsHour = value.hour;
                this.client.filter2BeginsMinute = value.minute;
            }
            this.sendFilterCyclesConfig();
        } catch (error) {
            console.error(`Error setting filter cycle begins time for filter ${filterNum}:`, error);
        }
    }

    async filterCycleRunsTime(filterNum, value) {
        try {
            if (filterNum === 1) {
                this.client.filter1RunsHour = value.hour;
                this.client.filter1RunsMinute = value.minute;
            } else if (filterNum === 2) {
                this.client.filter2RunsHour = value.hour;
                this.client.filter2RunsMinute = value.minute;
            }
            this.sendFilterCyclesConfig();
        } catch (error) {
            console.error(`Error setting filter cycle runs time for filter ${filterNum}:`, error);
        }
    }

    async filter2Enabled(value) {
        try {
            this.client.filter2Enabled = value;
            this.sendFilterCyclesConfig();
        } catch (error) {
            console.error('Error enabling filter 2:', error);
        }
    }

    async heatMode(value) {
        try {
            if (this.client.spaStatus.heatingMode === value) {
                return;
            }
            this.sendToggleMessage(0x51);
            this.client.spaStatus.heatMode = value;
        } catch (error) {
            console.error('Error setting heat mode:', error);
        }
    }

    async holdMode(value) {
        try {
            if (this.client.holdMode === value) {
                return;
            }
            this.sendToggleMessage(0x3c);
            this.client.holdMode = value;
        } catch (error) {
            console.error('Error setting hold mode:', error);
        }
    }


    async light(lightNum, value) {
        try {
            let lightVal = this.client.spaStatus.light1;
            let lightCode = 0x11;
            if (lightNum === 2) {
                lightVal = this.client.spaStatus.light2;
                lightCode = 0x12;
            }
            if (lightVal === value) {
                return;
            }
            this.sendToggleMessage(lightCode);
            if (lightNum === 1) {
                this.client.spaStatus.light1 = value;
            } else if (lightNum === 2) {
                this.client.spaStatus.light2 = value;
            }
        } catch (error) {
            console.error(`Error setting light ${lightNum}:`, error);
        }
    }
    


    async mister(value) {
        try {
            if (this.client.mister === value) {
                return;
            }
            this.sendToggleMessage(0x0e);
            this.client.mister = value;
        } catch (error) {
            console.error('Error setting mister:', error);
        }
    }

    async normalOperation(value) {
        try {
            if (this.client.normalOperation === value) {
                return;
            }
            this.sendToggleMessage(0x01);
            this.client.normalOperation = value;
        } catch (error) {
            console.error('Error setting normal operation:', error);
        }
    }

    async pump(pumpNum, value) {
        try {
            let pumpVal = this.client.pump1;
            let pumpCode = 0x04;
            switch (pumpNum) {
                case 2:
                    pumpVal = this.client.pump2;
                    pumpCode = 0x05;
                    break;
                case 3:
                    pumpVal = this.client.pump3;
                    pumpCode = 0x06;
                    break;
                case 4:
                    pumpVal = this.client.pump4;
                    pumpCode = 0x07;
                    break;
                case 5:
                    pumpVal = this.client.pump5;
                    pumpCode = 0x08;
                    break;
                case 6:
                    pumpVal = this.client.pump6;
                    pumpCode = 0x09;
                    break;
            }
            if (pumpVal === value) {
                return;
            }
            this.sendToggleMessage(pumpCode);
            switch (pumpNum) {
                case 1:
                    this.client.pump1 = value;
                    break;
                case 2:
                    this.client.pump2 = value;
                    break;
                case 3:
                    this.client.pump3 = value;
                    break;
                case 4:
                    this.client.pump4 = value;
                    break;
                case 5:
                    this.client.pump5 = value;
                    break;
                case 6:
                    this.client.pump6 = value;
                    break;
            }
        } catch (error) {
            console.error(`Error setting pump ${pumpNum}:`, error);
        }
    }

    async standbyMode() {
        try {
            this.sendToggleMessage(0x1d);
        } catch (error) {
            console.error('Error setting standby mode:', error);
        }
    }

    async tempRange(value) {
        try {
            if (this.client.spaStatus.tempRange === value) {
                return;
            }
            this.sendToggleMessage(0x50);

            if (value === 'high') {
                this.client.spaStatus.tempRange = 'high';
            } else if (value === 'low') {
                this.client.spaStatus.tempRange = 'low';
            }
        } catch (error) {
            console.error('Error setting temperature range:', error);
        }
    }

    async temperature(temp) {
        try {
            this.client.sendMessage(Buffer.from([0x0a, 0xbf, 0x20]), Buffer.from([parseInt(temp * 2)]));
        } catch (error) {
            console.error('Error setting temperature:', error);
        }
    }

    async temperatureScale(temperatureScale) {
        try {
            this.client.sendMessage(Buffer.from([0x0a, 0xbf, 0x27]), Buffer.from([]));
        } catch (error) {
            console.error('Error setting temperature scale:', error);
        }
    }

    async sendFilterCyclesConfig() {
        try {
            this.client.sendMessage(Buffer.from([0x0a, 0xbf, 0x23]),
                Buffer.concat([
                    Buffer.from([this.client.filter1BeginsHour]),
                    Buffer.from([this.client.filter1BeginsMinute]),
                    Buffer.from([this.client.filter1RunsHour]),
                    Buffer.from([this.client.filter1RunsMinute]),
                    Buffer.from([this.client.filter2Enabled << 7 | this.client.filter2BeginsHour]),
                    Buffer.from([this.client.filter2BeginsMinute]),
                    Buffer.from([this.client.filter2RunsHour]),
                    Buffer.from([this.client.filter2RunsMinute])
                ])
            );
        } catch (error) {
            console.error('Error sending filter cycles config:', error);
        }
    }
    
    async sendFilterCyclesRequest() {
        try {
            this.client.sendMessage(Buffer.from([0x0a, 0xbf, 0x22]), Buffer.from([0x01, 0x00, 0x00]));
            while (!this.client.filterCyclesLoaded) {
                this.client.readMsg();
            }
        } catch (error) {
            console.error('Error sending filter cycles request:', error);
        }
    }
    
    async sendGfciTestRequest() {
        try {
            this.client.sendMessage(Buffer.from([0x0a, 0xbf, 0x22]), Buffer.from([0x80, 0x00, 0x00]));
            while (!this.client.gfciTestLoaded) {
                this.client.readMsg();
            }
        } catch (error) {
            console.error('Error sending GFCI test request:', error);
        }
    }
    
    async sendInformationRequest() {
        try {
            this.client.sendMessage(Buffer.from([0x0a, 0xbf, 0x22]), Buffer.from([0x02, 0x00, 0x00]));
            while (!this.client.informationLoaded) {
                this.client.readMsg();
            }
        } catch (error) {
            console.error('Error sending information request:', error);
        }
    }
    
    async sendModuleIdentificationRequest() {
        try {
            this.client.sendMessage(Buffer.from([0x0a, 0xbf, 0x04]), Buffer.from([]));
            while (!this.client.moduleIdentificationLoaded) {
                this.client.readMsg();
            }
        } catch (error) {
            console.error('Error sending module identification request:', error);
        }
    }
    
    async sendPreferencesRequest() {
        try {
            this.client.sendMessage(Buffer.from([0x0a, 0xbf, 0x22]), Buffer.from([0x08, 0x00, 0x00]));
            while (!this.client.preferencesLoaded) {
                this.client.readMsg();
            }
        } catch (error) {
            console.error('Error sending preferences request:', error);
        }
    }
    
    sendToggleMessage(item) {
        try {
            this.client.sendMessage(Buffer.from([0x0a, 0xbf, 0x11]), Buffer.from([item, 0x00]));
        } catch (error) {
            console.error('Error sending toggle message:', error);
        }
    }    
}

module.exports = SpaCommandsSet;