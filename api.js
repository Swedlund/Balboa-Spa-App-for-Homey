module.exports = {
    async getLogToTimeline({ homey }) {
      const value = await homey.settings.get('logToTimeline');
      return value !== null ? value : false;
    },
  
    async setLogToTimeline({ homey, body }) {
      const { value } = body;
      await homey.settings.set('logToTimeline', value);
      return { success: true };
    }
  };
  