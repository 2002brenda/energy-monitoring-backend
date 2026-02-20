# Energy Monitoring System – Backend

Backend system for realtime energy monitoring using MQTT, InfluxDB, and REST API.  
This project is developed as a practical test for Backend Developer Intern.

---

## 1. Project Overview

This system receives electrical energy data from multiple panels via MQTT, stores the data in a time-series database (InfluxDB), and exposes REST APIs to be consumed by a monitoring dashboard.

The system supports:
- Realtime monitoring of electrical panels
- Online / Offline panel status
- Daily energy usage and electricity cost
- Monthly energy usage per panel

---

## 2. System Architecture

**Data Flow:**

Sensor Simulator  
→ MQTT Broker  
→ Backend MQTT Subscriber  
→ InfluxDB  
→ REST API  
→ Dashboard

---

## 3. Database Design (ERD)

This project uses **InfluxDB (time-series database)**, therefore it does not use relational tables.

### Measurement: `energy_data`

Attributes:
- `panel` (tag) – Panel identifier (PANEL_LANTAI_1, PANEL_LANTAI_2, PANEL_LANTAI_3)
- `power_kw` (field) – Electrical power (kW)
- `energy_kwh` (field) – Accumulative energy (kWh)
- `time` (timestamp) – Time when data is recorded

---

## 4. Sensor Data Publisher

**File:** `sensor-publisher.js`

This program simulates electrical sensors and sends data to MQTT topics.

**Features:**
- Simulates 3 electrical panels
- Sends data every 1 minute
- Energy value (`kWh`) is cumulative

**MQTT Topics:**
- `DATA/PM/PANEL_LANTAI_1`
- `DATA/PM/PANEL_LANTAI_2`
- `DATA/PM/PANEL_LANTAI_3`

---

## 5. Sensor Data Subscriber

**File:** `mqtt-subscriber.js`

This program subscribes to MQTT topics and stores incoming data into InfluxDB.

**Responsibilities:**
- Subscribe to all panel topics using wildcard (`DATA/PM/#`)
- Parse incoming sensor data
- Store data as time-series records in InfluxDB

---

## 6. REST API Documentation

### 6.1 Realtime Panel Status
**Endpoint**
```

GET /api/panel/realtime

```

Returns realtime data of each panel and its status (ONLINE / OFFLINE).

---

### 6.2 Today Energy Usage & Cost
**Endpoint**
```

GET /api/panel/today-usage

```

Calculates today’s energy usage and electricity cost.

**Formula**
```

Today Usage = kWh_now - kWh_start_of_day
Cost = Today Usage × 1500

```

Negative values are prevented to handle sensor restart scenarios.

---

### 6.3 Monthly Energy Usage
**Endpoint**
```

GET /api/energy/monthly?year=YYYY

```

Returns monthly energy usage per panel.

---

### 6.4 Panel Summary
**Endpoint**
```

GET /api/panel/summary

````

Returns the latest data of each panel for the current day.

---

## 7. InfluxDB Configuration

This project uses **InfluxDB Cloud** as an external time-series database.

For security reasons, database credentials are **not included** in this repository.

To run this project with database connection, configure the following variables inside:

- `mqtt-subscriber.js`
- `server.js`

```js
const url = 'YOUR_INFLUXDB_URL';
const token = 'YOUR_INFLUXDB_TOKEN';
const org = 'YOUR_ORG_NAME';
const bucket = 'energy_monitoring';
````

> Note: For code review purposes, database connection is optional.
> The main focus of this project is system architecture, data flow, and REST API implementation.

---

## 8. Technology Stack

* Node.js
* Express.js
* MQTT (HiveMQ Public Broker)
* InfluxDB Cloud
* JavaScript

---

## 9. Project Structure

```
energy-monitoring-backend/
├── sensor-publisher.js     # Sensor simulator
├── mqtt-subscriber.js      # MQTT subscriber & database writer
├── server.js               # REST API backend
├── package.json
└── README.md
```

---

## 10. How to Run

### Prerequisites

* Node.js (v16+)
* npm
* InfluxDB Cloud account (optional for code review)

### 1. Install dependencies

```
npm install
```

### 2. Run MQTT Subscriber

```
node mqtt-subscriber.js
```

### 3. Run Sensor Simulator

```
node sensor-publisher.js
```

### 4. Run REST API Server

```
node server.js
```

REST API will be available at:

```
http://localhost:3000
```

---

## 11. Available API Endpoints

* GET `/api/panel/realtime`
* GET `/api/panel/today-usage`
* GET `/api/energy/monthly`
* GET `/api/panel/summary`

---

## 12. Conclusion

This project demonstrates a simple and scalable backend system for realtime energy monitoring using MQTT, InfluxDB, and RESTful services.

