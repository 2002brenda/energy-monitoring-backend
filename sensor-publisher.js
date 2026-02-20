const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://broker.hivemq.com');

const panels = {
  PANEL_LANTAI_1: 100,
  PANEL_LANTAI_2: 200,
  PANEL_LANTAI_3: 300
};

client.on('connect', () => {
  console.log('Sensor connected');

  setInterval(() => {

    for (const panel in panels) {

      // simulasi akumulatif kWh (seperti meter listrik asli)
      panels[panel] += 0.05;

      const payload = {
        status: "OK",
        data: {
          v: [224.7, 224.7, 0, 149.8],
          i: [0, 0.2, 0.02, 0.07],
          power_kw: 0.34,
          energy_kwh: panels[panel],
          pf: 0.9,
          vunbal: 0.009,
          iunbal: 0.009,
          time: new Date().toISOString()
        }
      };

      client.publish(`DATA/PM/${panel}`, JSON.stringify(payload));
      console.log(`Data sent from ${panel}`);
    }

  }, 60000);

});
