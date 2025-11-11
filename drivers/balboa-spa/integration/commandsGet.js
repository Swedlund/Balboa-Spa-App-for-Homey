class SpaCommandsGet {
    constructor(client) {
        this.client = client;
    }

    async socket() {
        return await this.client.getSocket();
    }

    aux(auxNum) {
        return auxNum === 1 ? this.client.aux1 : this.client.aux2;
    }

    auxList() {
        return this.client.cfgAuxArray;
    }

    blowerList() {
        return this.client.cfgBlowerArray;
    }

    circPumpList() {
        return this.client.cfgCircPumpArray;
    }

    filterBegins(filterNum) {
        if (filterNum === 1) {
            return `${this.client.filter1BeginsHour}:${this.client.filter1BeginsMinute.toString().padStart(2, '0')}`;
        } else {
            return `${this.client.filter2BeginsHour}:${this.client.filter2BeginsMinute.toString().padStart(2, '0')}`;
        }
    }

    filterBeginsHour(filterNum) {
        return filterNum === 1 ? this.client.filter1BeginsHour : this.client.filter2BeginsHour;
    }

    filterBeginsMinute(filterNum) {
        return filterNum === 1 ? this.client.filter1BeginsMinute : this.client.filter2BeginsMinute;
    }

    filterEnds(filterNum) {
        if (filterNum === 1) {
            const endHour = (this.client.filter1BeginsHour + this.client.filter1RunsHour) % 24;
            const endMinute = (this.client.filter1BeginsMinute + this.client.filter1RunsMinute) % 60;
            return `${endHour}:${endMinute.toString().padStart(2, '0')}`;
        } else {
            const endHour = (this.client.filter2BeginsHour + this.client.filter2RunsHour) % 24;
            const endMinute = (this.client.filter2BeginsMinute + this.client.filter2RunsMinute) % 60;
            return `${endHour}:${endMinute.toString().padStart(2, '0')}`;
        }
    }

    filterMode(filterNum) {
        if (filterNum === 1) {
            return this.client.filterMode === 1 || this.client.filterMode === 3;
        } else {
            return this.client.filterMode === 2 || this.client.filterMode === 3;
        }
    }

    filterRuns(filterNum) {
        if (filterNum === 1) {
            return `${this.client.filter1RunsHour} hours | ${this.client.filter1RunsMinute} minutes`;
        } else {
            return `${this.client.filter2RunsHour} hours | ${this.client.filter2RunsMinute} minutes`;
        }
    }

    filterRunsHour(filterNum) {
        return filterNum === 1 ? this.client.filter1RunsHour : this.client.filter2RunsHour;
    }

    filterRunsMinute(filterNum) {
        return filterNum === 1 ? this.client.filter1RunsMinute : this.client.filter2RunsMinute;
    }

    filter2Enabled() {
        return this.client.filter2Enabled;
    }

    heatMode() {
        return this.client.heatMode;
    }

    highRangeMax() {
        return this.client.addInfoHighRangeMax;
    }

    highRangeMin() {
        return this.client.addInfoHighRangeMin;
    }

    holdMode() {
        return this.client.holdMode;
    }

    holdModeRemainTime() {
        const hours = Math.floor(this.client.holdModeRemainTime / 60);
        const minutes = this.client.holdModeRemainTime % 60;
        return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }

    lightList() {
        return this.client.cfgLightArray;
    }

    lowRangeMax() {
        return this.client.addInfoLowRangeMax;
    }

    lowRangeMin() {
        return this.client.addInfoLowRangeMin;
    }

    macAddr() {
        return this.client.idMacAddr;
    }

    misterList() {
        return this.client.cfgMisterArray;
    }

    modelName() {
        return this.client.infoModelName;
    }

    pump(pumpNum) {
        switch (pumpNum) {
            case 1: return this.client.pump1;
            case 2: return this.client.pump2;
            case 3: return this.client.pump3;
            case 4: return this.client.pump4;
            case 5: return this.client.pump5;
            case 6: return this.client.pump6;
            default: return null;
        }
    }

    pumpList() {
        return this.client.cfgPumpArray;
    }

    ssid() {
        return this.client.infoSsid;
    }
}

module.exports = SpaCommandsGet;