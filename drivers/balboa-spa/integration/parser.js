class SpaParser {
    identifyResponseType(byteArray) {
        const messageType = byteArray[4];
        switch (messageType) {
            case 0x25:
                return 'additional_information_response';
            case 0x2E:
                return 'configuration_response';
            case 0x28:
                return 'fault_log_response';
            case 0x23:
                return 'filter_cycles_response';
            case 0x2B:
                return 'gfci_test_response';
            case 0x24:
                return 'information_response';
            case 0x94:
                return 'module_identification_response';
            case 0x26:
                return 'preferences_response';
            case 0x20:
            case 0x13:
                return 'status_update';
            default:
                return 'unknown_response';
        }
    }

    parseStatusUpdate(byteArray) {
        const status = {};

        status.runningMode = byteArray[5] === 0x00 ? "Running" : byteArray[5] === 0x01 ? "Initializing" : byteArray[5] === 0x05 ? "Hold Mode" : byteArray[5] === 0x14 ? "A/B Temps ON" : byteArray[5] === 0x17 ? "Test Mode" : "Unknown";
        status.primingMode = byteArray[6] === 0x00 ? "Idle" : byteArray[6] === 0x01 ? "Priming Mode" : byteArray[6] === 0x02 ? "Fault" : byteArray[6] === 0x03 ? "Reminder" : byteArray[6] === 0x04 ? "Stage 1" : byteArray[6] === 0x05 ? "Stage 3" : byteArray[6] === 0x42 ? "Stage 2" : "Unknown";
        
        const flag = byteArray[14];
        status.tempScale = (flag & 0x01) === 0 ? "Fahrenheit" : "Celsius";
        status.currentTemp = byteArray[7] !== 0xFF ? (status.temp_scale === "Fahrenheit" ? byteArray[7] : byteArray[7] / 2) : null;
        status.setTemp = byteArray[25] !== 0xFF ? (status.temp_scale === "Fahrenheit" ? byteArray[25] : byteArray[25] / 2) : null;

        status.hour = byteArray[8];
        status.minute = byteArray[9];
        status.heatingMode = ["ready", "rest", "ready+rest"][byteArray[10]];
        status.reminderType = byteArray[11] === 0x00 ? "none" : byteArray[11] === 0x04 ? "clean_filter" : byteArray[11] === 0x0A ? "check_the_pH" : byteArray[11] === 0x09 ? "check_the_sanitizer" : byteArray[11] === 0x1E ? "fault" : "unknown";
        status.sensorATemp = byteArray[12];
        status.sensorBTemp = byteArray[13];
        status.timeScale = (flag & 0x02) === 0 ? "12 Hr" : "24 Hr";
        status.filterMode = ["off", "cycle_1", "cycle_2", "cycle_1_&_2"][(flag & 0x0c) >> 2];
        status.heating = ["off", "heating", "heat_waiting"][(byteArray[15] & 0x30) >> 4];
        status.tempRange = (byteArray[15] & 0x04) >> 2 === 0 ? "low" : "high";
        status.pump1 = ["off", "low", "high"][byteArray[16] & 0x03];
        status.pump2 = ["off", "low", "high"][(byteArray[16] >> 2) & 0x03];
        status.pump3 = ["off", "low", "high"][(byteArray[16] >> 4) & 0x03];
        status.pump4 = ["off", "low", "high"][(byteArray[16] >> 6) & 0x03];
        status.pump5 = ["off", "low", "high"][byteArray[17] & 0x03];
        status.pump6 = ["off", "low", "high"][(byteArray[17] >> 6) & 0x03];
        status.circPump = (byteArray[18] & 0x02) ? "on" : "off";
        status.blower = (byteArray[18] & 0x0c) >> 2 === 0 ? false : true;
        status.light1 = (byteArray[19] & 0x03) === 0x03;
        status.light2 = (byteArray[19] >> 6 & 0x03) === 0x03;
        status.mister = (byteArray[20] & 0x01) === 0 ? "off" : "on";
        status.aux1 = byteArray[20] & 0x08;
        status.aux2 = byteArray[20] & 0x10;
        status.standbyMode = (byteArray[22] & 0x01) === 1;

        return status;
    }

    parsePreferencesResponse(byteArray) {
        const preferences = {};

        preferences.reminders = byteArray[1] === 0x01 ? "On" : "Off";
        preferences.temp_scale = byteArray[3] === 0x01 ? "Celsius" : "Fahrenheit";
        preferences.clock_mode = byteArray[4] === 0x01 ? "24 Hr" : "12 Hr";
        preferences.clean_up_cycle = byteArray[5];
        preferences.dolphin_address = byteArray[6];
        preferences.m8_ai = byteArray[8] === 0x01 ? "On" : "Off";

        return preferences;
    }

    parseModuleIdentificationResponse(byteArray) {
        const moduleIdentification = {};

        moduleIdentification.mac_address = `${byteArray[3].toString(16).padStart(2, '0')}:${byteArray[4].toString(16).padStart(2, '0')}:${byteArray[5].toString(16).padStart(2, '0')}:${byteArray[6].toString(16).padStart(2, '0')}:${byteArray[7].toString(16).padStart(2, '0')}:${byteArray[8].toString(16).padStart(2, '0')}`;
        moduleIdentification.mac_oui = `${byteArray[17].toString(16).padStart(2, '0')}:${byteArray[18].toString(16).padStart(2, '0')}:${byteArray[19].toString(16).padStart(2, '0')}`;
        moduleIdentification.mac_nic = `${byteArray[22].toString(16).padStart(2, '0')}:${byteArray[23].toString(16).padStart(2, '0')}:${byteArray[24].toString(16).padStart(2, '0')}`;

        return moduleIdentification;
    }

    parseAdditionalInformationResponse(byteArray) {
        const additionalInfo = {};
    
        additionalInfo.low_range_min = byteArray[2];
        additionalInfo.low_range_max = byteArray[3];
        additionalInfo.high_range_min = byteArray[4];
        additionalInfo.high_range_max = byteArray[5];
    
        additionalInfo.number_of_pumps = (
            (byteArray[7] & 0x01) +
            ((byteArray[7] >> 1) & 0x01) +
            ((byteArray[7] >> 2) & 0x01) +
            ((byteArray[7] >> 3) & 0x01) +
            ((byteArray[7] >> 4) & 0x01) +
            ((byteArray[7] >> 5) & 0x01)
        );
    
        return additionalInfo;
    }

    parseConfigurationResponse(byteArray) {
        const configuration = {};
    
        configuration.pumps = [
            byteArray[0] & 0x03,
            (byteArray[0] & 0x0c) >> 2,
            (byteArray[0] & 0x30) >> 4,
            (byteArray[0] & 0xc0) >> 6,
            byteArray[1] & 0x03,
            (byteArray[1] & 0xc0) >> 6
        ];
    
        configuration.lights = [
            (byteArray[2] & 0x03) !== 0,
            (byteArray[2] & 0xc0) !== 0
        ];
    
        configuration.circ_pump = (byteArray[3] & 0x80) !== 0;
        configuration.blower = (byteArray[3] & 0x03) !== 0;
        configuration.mister = (byteArray[4] & 0x30) !== 0;
    
        configuration.aux = [
            (byteArray[4] & 0x01) !== 0,
            (byteArray[4] & 0x02) !== 0
        ];
    
        return configuration;
    }

    parseFilterCyclesResponse(byteArray) {
        const filterCycles = {};
    
        filterCycles.filter_1 = {
            begins_hour: byteArray[0],
            begins_minute: byteArray[1],
            runs_hour: byteArray[2],
            runs_minute: byteArray[3]
        };
    
        filterCycles.filter_2 = {
            enabled: byteArray[4] >> 7,
            begins_hour: byteArray[4] & 0x7F,
            begins_minute: byteArray[5],
            runs_hour: byteArray[6],
            runs_minute: byteArray[7]
        };
    
        return filterCycles;
    }

    parseGfciTestResponse(byteArray) {
        const gfciTest = {};
    
        gfciTest.result = byteArray[0] === 0x01 ? "PASS" : "FAIL";
    
        return gfciTest;
    }

    parseInformationResponse(byteArray) {
        const information = {};
    
        const model = [
            byteArray[4], byteArray[5], byteArray[6], byteArray[7],
            byteArray[8], byteArray[9], byteArray[10], byteArray[11]
        ];
        information.model_name = String.fromCharCode(...model).trim();
    
        information.software_version = `${byteArray[2]}.${byteArray[3]}`;
        information.setup_number = byteArray[12];
        information.ssid = `M${byteArray[0]}_${byteArray[1]} V${information.software_version}`;
        information.configuration_signature = `${byteArray[13].toString(16)}${byteArray[14].toString(16)}${byteArray[15].toString(16)}${byteArray[16].toString(16)}`;
        information.heater_voltage = byteArray[17] === 0x01 ? 240 : "Unknown";
        information.heater_type = byteArray[18] === 0x0A ? "Standard" : "Unknown";
        information.dip_switch_settings = `${byteArray[19].toString(2).padStart(8, '0')}${byteArray[20].toString(2).padStart(8, '0')}`;
    
        return information;
    }

    parseFaultLogResponse(byteArray) {
        const faultLog = {};
    
        faultLog.total_entries = byteArray[0];
        faultLog.entry_number = byteArray[1];
        faultLog.message_code = byteArray[2];
        faultLog.days_ago = byteArray[3];
        faultLog.time_hour = byteArray[4];
        faultLog.time_minute = byteArray[5];
        faultLog.flags = byteArray[6];
        faultLog.set_temp = byteArray[7];
        faultLog.sensor_a_temp = byteArray[8];
        faultLog.sensor_b_temp = byteArray[9];
    
        return faultLog;
    }

}

module.exports = SpaParser;