# 🔍 CyberTrace - Cyber Investigation Platform

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/python-3.10+-yellow.svg)
![React](https://img.shields.io/badge/react-18.3-61dafb.svg)

**A comprehensive cyber investigation and domain intelligence platform for law enforcement and security professionals.**

</div>

---

## ✨ Features

### 🔎 Domain Investigation
- **WHOIS Lookup** - Domain registration details, ownership information
- **DNS Resolution** - A, AAAA, MX, NS, TXT records
- **SSL Certificate Analysis** - Issuer, validity, chain inspection
- **Reputation Scoring** - Multi-source threat intelligence

### 🗺️ National Cybercrime Surveillance (India)
- **Live Threat Map** - Real-time geospatial threat visualization
- **Hotspot Monitoring** - Jamtara, Nuh, Mumbai, Delhi, Bangalore
- **Deep Filtering** - Search by city or threat type
- **Dynamic Analytics** - Charts update based on filtered data

### 📊 Investigation Dashboard
- Scan history with persistent storage
- PDF report generation
- Case management interface
- Real-time status indicators

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, TailwindCSS, Shadcn/UI |
| **Backend** | FastAPI, Python 3.10+, SQLAlchemy, SQLite |
| **Mapping** | Leaflet, React-Leaflet, CARTO Dark Tiles |
| **Charts** | Recharts |
| **State** | TanStack Query (React Query) |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python run.py
```

Backend runs at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:8080`

---

## 📁 Project Structure

```
Domain-Intel/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # API routes
│   │   │   ├── scan.py          # Domain scanning
│   │   │   ├── intel.py         # Threat intelligence
│   │   │   └── auth.py          # Authentication
│   │   ├── services/            # Business logic
│   │   │   ├── domain_scanner.py
│   │   │   └── threat_ingestor.py
│   │   ├── db/                  # Database models
│   │   └── main.py              # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ThreatMap.tsx    # Leaflet map
│   │   │   ├── ThreatStatsCharts.tsx
│   │   │   └── TopNav.tsx
│   │   ├── pages/               # Route pages
│   │   │   └── GlobalThreats.tsx
│   │   └── lib/api.ts           # API client
│   └── package.json
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/scan/quick` | Quick domain scan |
| `POST` | `/api/v1/scan/full` | Full domain investigation |
| `GET` | `/api/v1/intel/map` | Threat map coordinates |
| `GET` | `/api/v1/intel/stats` | Aggregated threat statistics |
| `GET` | `/api/v1/scan/history` | Scan history |

---

## 🇮🇳 India Cybercrime Hotspots

The platform includes demo data for major Indian cybercrime hotspots:

| Location | Threat Type | Severity |
|----------|-------------|----------|
| Jamtara, JH | Phishing/Vishing | Critical |
| Nuh, HR | Financial Fraud | Critical |
| Mumbai, MH | Dark Web Nodes | Critical |
| Delhi NCR | Crypto Drainer | Critical |
| Bangalore, KA | Tech Support Scam | High |

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

<div align="center">
Made with ❤️ for Cyber Investigation
</div>
