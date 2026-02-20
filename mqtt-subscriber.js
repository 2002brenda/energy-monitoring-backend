const mqtt = require('mqtt');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');

const url = 'https://us-east-1-1.aws.cloud2.influxdata.com';
const token = 'NVtAf7gpQuDlWrXOa37cjpAmxxN_iAnsj-sFlHTGw9X4FtarqAnsaT8FR2CAyMP66zi8K2-dF3uEdgrAqH29Pg==';
const org = 'ravelware-test';
const bucket = 'energy_monitoring';

const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket);

mqttClient.on('connect', () => {
  console.log('Backend connected to MQTT');
  mqttClient.subscribe('DATA/PM/#'); // SUBSCRIBE SEMUA PANEL
});

mqttClient.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());

    const panel = topic.split('/').pop(); // PANEL_LANTAI_1

    const data = payload.data;

    const point = new Point('energy_data')
      .tag('panel', panel)
      .floatField('power_kw', Number(data.power_kw))
      .floatField('energy_kwh', Number(data.energy_kwh))
      .timestamp(new Date(data.time)); // PAKAI TIME DARI SENSOR

    writeApi.writePoint(point);
    console.log(`Saved data from ${panel}`);
  } catch (err) {
    console.error('Error processing MQTT message', err);
  }
});
