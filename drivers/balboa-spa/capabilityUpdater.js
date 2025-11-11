const utils = require('./utils');

async function updateCapabilities(device, data) {
    const capabilities = {
        alarm_connectivity: data.connectivityAlarm,
        blower: data.blower,
        circPump: data.circPump,
        heating: data.heating,
        light1: data.light1,
        light2: data.light2,
        modeFilter: data.filterMode,
        modeHeating: data.heatingMode,
        modePriming: data.primingMode,
        modeRunning: data.runningMode,
        modeStandby: data.standbyMode,
        pump1: data.pump1,
        pump2: data.pump2,
        pump3: data.pump3,
        pump4: data.pump4,
        pump5: data.pump5,
        pump6: data.pump6,
        reminderType: data.reminderType,
        tempRange: data.tempRange,
        tempScale: data.tempScale,
        tempSensorA: data.sensorATemp,
        tempSensorB: data.sensorBTemp,
        target_temperature_level: data.tempRange,
        measure_temperature: data.currentTemp !== undefined ? data.currentTemp : 0,
        target_temperature: data.setTemp !== undefined ? data.setTemp : 0,
        time: utils.formatTime(data.hour, data.minute),
        timeScale: data.timeScale
    };

    for (const [capability, value] of Object.entries(capabilities)) {
        if (value !== undefined) {
            device.setCapabilityValue(capability, value);
        }
    }

    handleTempRange(device, data.tempRange);
    handleColdAlarm(device, data.currentTemp, data.setTemp);
    handleHeatingMeasurement(device, data.currentTemp, data.setTemp, data.tempRange);
}

function handleTempRange(device, tempRange) {
    if (tempRange === undefined) return;

    if (tempRange === 'high') {
        device.setCapabilityOptions('target_temperature', { min: 26, max: 40 });
    } else if (tempRange === 'low') {
        device.setCapabilityOptions('target_temperature', { min: 10, max: 26 });
    }
}

function handleColdAlarm(device, currentTemp, setTemp) {
    if (currentTemp === undefined || setTemp === undefined) return;
    const freezingRisk = utils.checkFreezingRisk(device.tempHistory, setTemp);
    device.setCapabilityValue('alarm_cold', freezingRisk);
}

function handleHeatingMeasurement(device, currentTemp, setTemp, tempRange) {
  if (currentTemp === undefined || setTemp === undefined || tempRange === undefined) return;

  if (tempRange === 'high' && !device.checkTemperature) {
    device.checkTemperature = utils.startHeatingMeasurement(device, setTemp);
    utils.logToTimeline(device.homey, 'Heating measurement started');
  } else if (tempRange === 'low' && device.checkTemperature) {
    device.checkTemperature = null;
    console.log('[HeatingMeasurement] Heating measurement cancelled due to tempRange = low');
    utils.logToTimeline(device.homey, 'Heating measurement cancelled (low temperature range)');
  }

  if (device.checkTemperature) {
    const result = device.checkTemperature(currentTemp);
    if (result !== null) {
      device.setCapabilityValue('heatingTime', result.toFixed(1));
      utils.logToTimeline(device.homey, `Heating completed. Average time: ${result.toFixed(1)} hours`);
    }
  }
}

module.exports = {
    updateCapabilities
};
