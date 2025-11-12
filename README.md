# <img src="https://github.com/Swedlund/Balboa-Spa-App-for-Homey/blob/main/assets/icon.png?raw=true" width="28" alt="Icon"/> Balboa Spa App for Homey

Control your Balboa Spa hot tub from Homey using the 50350 WiFi module – no cloud, no hassle.  
This Homey app enables seamless local integration with Balboa Spas via WebSocket, automatically discovering spa modules on your local network when adding a device.

## 🔧 Features

- **Automatic discovery** of Balboa 50350 WiFi modules on your LAN during device setup
- **Local WebSocket connection** – no cloud dependency
- Real-time status updates from your spa
- Control pumps, lights, temperature, and more
- Compatible with advanced Homey flows

## 📦 Requirements

- Balboa Spa with a 50350 WiFi module
- Homey (Pro or Bridge with advanced flows)
- Spa and Homey must be on the same local network

## 🚀 Getting Started

1. Install the app on your Homey.
2. Go to **Devices** and add a new device using this app.
3. The app will automatically detect any Balboa Spa modules on your network.
4. Start automating your spa experience!

## 💡 Notes

This app uses the undocumented WebSocket protocol used by the Balboa 50350 module. Stability may vary depending on firmware versions.

---

Feel free to contribute, report issues, or suggest improvements!
