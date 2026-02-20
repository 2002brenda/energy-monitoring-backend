const express = require('express');
const cors = require('cors');
const { InfluxDB } = require('@influxdata/influxdb-client');

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// INFLUXDB CONFIG
// ===============================
const url = 'https://us-east-1-1.aws.cloud2.influxdata.com';
const token = 'NVtAf7gpQuDlWrXOa37cjpAmxxN_iAnsj-sFlHTGw9X4FtarqAnsaT8FR2CAyMP66zi8K2-dF3uEdgrAqH29Pg==';
const org = 'ravelware-test';
const bucket = 'energy_monitoring';

const influxDB = new InfluxDB({ url, token });
const queryApi = influxDB.getQueryApi(org);

// ===============================
// 1️⃣ REALTIME PANEL + ONLINE/OFFLINE
// ===============================
app.get('/api/panel/realtime', (req, res) => {
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "energy_data")
      |> group(columns: ["panel"])
      |> last()
  `;

  const panels = {};

  queryApi.queryRows(fluxQuery, {
    next(row, tableMeta) {
      const data = tableMeta.toObject(row);

      const panel = data.panel;
      const lastUpdate = new Date(data._time);
      const now = new Date();
      const diffSeconds = (now - lastUpdate) / 1000;

      if (!panels[panel]) {
        panels[panel] = {
          panel,
          power_kw: null,
          energy_kwh: null,
          last_update: lastUpdate,
          status: diffSeconds > 300 ? 'OFFLINE' : 'ONLINE'
        };
      }

      if (data._field === 'power_kw') panels[panel].power_kw = data._value;
      if (data._field === 'energy_kwh') panels[panel].energy_kwh = data._value;
    },
    complete() {
      res.json(Object.values(panels));
    },
    error(err) {
      res.status(500).json({ error: err.message });
    }
  });
});

// ===============================
// 2️⃣ SUMMARY PANEL (HARI INI)
// ===============================
app.get('/api/panel/summary', (req, res) => {
  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: today())
      |> filter(fn: (r) => r._measurement == "energy_data")
      |> group(columns: ["panel"])
      |> last()
  `;

  const result = [];

  queryApi.queryRows(fluxQuery, {
    next(row, tableMeta) {
      result.push(tableMeta.toObject(row));
    },
    complete() {
      res.json(result);
    },
    error(err) {
      res.status(500).json({ error: err.message });
    }
  });
});

// ===============================
// 3️⃣ ENERGY BULANAN
// ===============================
app.get('/api/energy/monthly', (req, res) => {
  const year = req.query.year || new Date().getFullYear();

  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: ${year}-01-01T00:00:00Z, stop: ${year}-12-31T23:59:59Z)
      |> filter(fn: (r) =>
        r._measurement == "energy_data" and
        r._field == "energy_kwh"
      )
      |> group(columns: ["panel"])
      |> aggregateWindow(every: 1mo, fn: last)
      |> keep(columns: ["_time", "_value", "panel"])
  `;

  const result = [];

  queryApi.queryRows(fluxQuery, {
    next(row, tableMeta) {
      const data = tableMeta.toObject(row);
      const dateObj = new Date(data._time);

      result.push({
        panel: data.panel,
        month: data._time,
        month_label: `${dateObj.getMonth() + 1}-${dateObj.getFullYear()}`,
        energy_kwh: data._value
      });
    },
    complete() {
      res.json(result);
    },
    error(err) {
      res.status(500).json({ error: err.message });
    }
  });
});

// ===============================
// 4️⃣ TODAY USAGE + COST (ANTI MINUS)
// ===============================
app.get('/api/panel/today-usage', (req, res) => {
  const tariff = 1500;

  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: today())
      |> filter(fn: (r) =>
        r._measurement == "energy_data" and
        r._field == "energy_kwh"
      )
      |> group(columns: ["panel"])
      |> sort(columns: ["_time"])
  `;

  const panels = {};

  queryApi.queryRows(fluxQuery, {
    next(row, tableMeta) {
      const data = tableMeta.toObject(row);
      const panel = data.panel;
      const kwh = data._value;

      if (!panels[panel]) {
        panels[panel] = {
          panel,
          kwh_start: kwh,
          kwh_now: kwh
        };
      }

      panels[panel].kwh_now = kwh;
    },
    complete() {
      const result = Object.values(panels).map(item => {
        const rawUsage = item.kwh_now - item.kwh_start;
        const usage = rawUsage < 0 ? 0 : rawUsage;

        return {
          panel: item.panel,
          kwh_start: item.kwh_start,
          kwh_now: item.kwh_now,
          today_usage: usage,
          cost: Math.round(usage * tariff)
        };
      });

      res.json(result);
    },
    error(err) {
      res.status(500).json({ error: err.message });
    }
  });
});

// ===============================
app.get('/', (req, res) => {
  res.send('Energy Monitoring Backend API is running');
});

app.listen(3000, () => {
  console.log('REST API running on http://localhost:3000');
});
