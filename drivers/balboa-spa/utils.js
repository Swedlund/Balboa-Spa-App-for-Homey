const Homey = require('homey');

let lastNotificationTime = 0;

async function logToTimeline(homey, message, interval = 10000) {
  const now = Date.now();
  const logToTimeline = await homey.settings.get('logToTimeline');

  console.log(message);

  if (!logToTimeline) return;

  if (now - lastNotificationTime > interval) {
    try {
      await homey.notifications.createNotification({ excerpt: message });
      lastNotificationTime = now;
    } catch (err) {
      if (err.code === 429) {
        console.log('[WARNING] Rate limit hit for timeline notifications.');
      } else {
        console.log(`[ERROR] Failed to create notification: ${err.message}`);
      }
    }
  }
}


function formatTime(hour, minute) {
  if (hour !== undefined && minute !== undefined) {
    return `${hour}:${minute.toString().padStart(2, '0')}`;
  }
  return '00:00';
}

function getCurrentTime(homey) {
  const tz = homey.clock.getTimezone();
  const [date, time] = new Date().toLocaleString('en-GB', { timeZone: tz }).split(', ');
  const [hours, minutes] = time.split(':').map(Number);
  return { hours, minutes };
}

function logRecentValues(historyArray, newData) {
  if (!Array.isArray(historyArray)) {
    historyArray = [];
  }
  if (newData !== undefined) {
    if (historyArray.length >= 10) {
      historyArray.shift();
    }
    historyArray.push(newData);
  }
  return historyArray;
}

function checkFreezingRisk(tempHistory, setTemp) {
  const freezingThreshold = 0; // 0°C as the freezing point
  const earlyWarningThreshold = 5; // Early warning if temperatures approach 5°C
  const minDataPoints = 10; // Minimum data points required

  if (tempHistory.length < minDataPoints) {
      return false; // Not enough data points to assess risk
  }

  let belowFreezingCount = 0;
  let fallingBelowSetTempCount = 0;
  let totalChange = 0;
  let consistentDecrease = true;

  for (let i = 1; i < tempHistory.length; i++) {
      const temp = tempHistory[i];
      const prevTemp = tempHistory[i - 1];

      if (temp <= freezingThreshold) {
          belowFreezingCount++;
      }
      if (temp < setTemp) {
          fallingBelowSetTempCount++;
      }

      totalChange += (temp - prevTemp);

      if (temp >= prevTemp) {
          consistentDecrease = false; // Temperature is not consistently decreasing
      }
  }

  const closeToFreezing = tempHistory.some(temp => temp <= earlyWarningThreshold);
  const fallingTrend = fallingBelowSetTempCount >= minDataPoints / 2;
  const averageChange = totalChange / (tempHistory.length - 1);

  return consistentDecrease && (fallingTrend || closeToFreezing || averageChange < 0) && tempHistory[tempHistory.length - 1] < setTemp;
}

function startHeatingMeasurement(device, setTemp) {
  const startTime = new Date();

  return function checkTemperature(currentTemp) {
    if (currentTemp >= setTemp) {
      const endTime = new Date();
      const heatingTime = (endTime - startTime) / (1000 * 60 * 60);

      if (!Array.isArray(device.heatingTimes)) {
        device.heatingTimes = [];
      }

      device.heatingTimes.push(heatingTime);
      if (device.heatingTimes.length > 10) {
        device.heatingTimes.shift();
      }

      device.homey.settings.set('heatingTimes', device.heatingTimes);

      const averageHeatingTime = device.heatingTimes.reduce((sum, time) => sum + time, 0) / device.heatingTimes.length;
      return averageHeatingTime;
    }
    return null;
  };
}

module.exports = {
  formatTime,
  getCurrentTime,
  logRecentValues,
  checkFreezingRisk,
  startHeatingMeasurement,
  logToTimeline
};