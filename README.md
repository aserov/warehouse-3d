# 3D Warehouse Visualization System

An interactive 3D/2D warehouse layout viewer built with **Three.js**. It renders warehouse areas, rows, levels, and individual storage cells dynamically from a JSON configuration file (`cells-full.json`).

---

## 🚀 Quick Start (Windows)

The easiest way to launch the application is using the provided batch file:

1. Double-click **`run-warehouse.bat`**.
2. The local server will start, and your default web browser will automatically open at `http://localhost:3000`.

---

## 🛠 Manual Setup & Requirements

Due to browser Security Policies (CORS), modern browsers block `fetch()` requests when loading JSON files directly via the `file://` protocol. A local static web server is required.

### Prerequisites
* **Node.js** (v14 or higher) — [Download Node.js](https://nodejs.org/)

### Option: Using Node.js (`npx serve`)
Run the following command in the project root directory:

```bash
npx serve -l 3000