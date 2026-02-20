const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const token = 'NVtAf7gpQuDlWrXOa37cjpAmxxN_iAnsj-sFlHTGw9X4FtarqAnsaT8FR2CAyMP66zi8K2-dF3uEdgrAqH29Pg==';
const url = 'https://us-east-1-1.aws.cloud2.influxdata.com';
const org = 'ravelware-test';
const bucket = 'energy_monitoring';

const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket);

function saveToInflux(panel, data) {
  const point = new Point('energy_data')
    .tag('panel', panel)
    .floatField('power_kw', parseFloat(data.kW || data.kw || 0))
    .floatField('energy_kwh', parseFloat(data.kWh || data.klh || 0))
    .timestamp(new Date(data.time || new Date()));

  writeApi.writePoint(point);
}

module.exports = saveToInflux;
