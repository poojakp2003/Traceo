# Traceo

> An intelligent, end-to-end cross-platform activity and productivity tracking ecosystem. Seamlessly captures active desktop application usage, browser navigation, and YouTube learning sessions, consolidating all telemetry into a modern, real-time analytics dashboard with strict user privacy controls.

---

## Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Repository Structure](#-repository-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
  - [1. Backend Setup (FastAPI & PostgreSQL)](#1-backend-setup-fastapi--postgresql)
  - [2. Frontend Setup (React + Vite)](#2-frontend-setup-react--vite)
  - [3. Desktop Agent Setup (Python Background Daemon)](#3-desktop-agent-setup-python-background-daemon)
  - [4. Chrome Extension Setup (Manifest V3)](#4-chrome-extension-setup-manifest-v3)
- [How to Use the System](#-how-to-use-the-system)
- [REST API Endpoints](#-rest-api-endpoints)
- [Privacy & Security](#-privacy--security)
- [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## Overview

The **Productivity & Activity Tracker** is composed of four modular, high-performance components:

1. **Backend API (`backend/`)**: FastAPI + PostgreSQL application handling JWT authentication, telemetry ingestion, data aggregation, and privacy enforcement.
2. **Web Dashboard (`frontend/`)**: React 18 + Vite single-page application featuring interactive charts, domain breakdowns, YouTube history, and privacy toggles.
3. **Desktop Agent (`desktop-agent/`)**: Native Python background daemon that monitors active foreground windows and application focus intervals with disk-buffered offline resilience.
4. **Chrome Extension (`chrome-extension/`)**: Manifest V3 browser extension tracking web navigation, domain dwell time, YouTube playback, and Incognito browsing sessions.

---

##  System Architecture

```mermaid
flowchart TD
    subgraph Clients["Data Collection Clients"]
        DA["🖥️ Desktop Agent\n(Foreground Window Monitor)"]
        CE["🌐 Chrome Extension\n(Tab & YouTube Tracker)"]
    end

    subgraph Server["FastAPI Backend (Port 8000)"]
        AUTH["JWT Auth & Security"]
        PERM["Privacy & Permissions Guard"]
        INGEST["Ingestion Endpoints\n(/track/*)"]
        DASH_API["Dashboard Analytics Engine\n(/dashboard/*)"]
    end

    subgraph Storage["Database Layer"]
        DB[("PostgreSQL Database\n(Users, AppUsage, BrowserActivity,\nYouTubeActivity, Permissions)")]
    end

    subgraph UI["User Interface (Port 5173)"]
        WEB[" React + Vite Dashboard\n(Charts, Tables, Privacy Settings)"]
    end

    DA -- "POST /track/app-usage (Batched)" --> INGEST
    CE -- "POST /track/browser-activity\nPOST /track/youtube" --> INGEST
    INGEST --> PERM
    PERM --> DB

    WEB -- "POST /auth/login, /signup" --> AUTH
    WEB -- "GET /dashboard/*\nPUT /permissions" --> DASH_API
    DASH_API --> DB
```

---

##  Key Features

- **Accurate Window Interval Tracking**:
  - Automatically records exact start/end timestamps and active durations for applications (e.g. VS Code, Chrome, Slack).
  - Filters out sub-second rapid switching (Alt-Tab cycling) and ignored background system tasks (`LockApp.exe`, `SearchHost.exe`).
- **Web & YouTube Telemetry**:
  - Tracks web domain visits and active tab changes with automatic URL sanitization and domain extraction.
  - Granular YouTube video tracking: captures video ID, title, channel, and exact playback watch duration.
  - Spanning Incognito mode support (with user permission).
- **Offline Resilience & Batch Transmission**:
  - Both the Desktop Agent and Chrome Extension buffer telemetry in local storage/files (`.buffer.json`) when offline and flush automatically in batches once connectivity is restored.
- **Interactive Analytics Dashboard**:
  - High-level KPIs: Total screen time today, 7-day total, 30-day total, session counts.
  - App Usage Bar Charts: Ranked by duration with percentage breakdowns.
  - Daily Usage Timeline: Interactive timeline showing hours and session activity.
  - Domain Activity Table: Top visited websites and visit counts.
  - YouTube Video Log: Chronological video cards with watch time badges and quick links.
  - Dynamic Time Filters: `today`, `24h`, `7d`, `30d`, `all`.
- **Privacy First**:
  - Full user sovereignty: Toggle App Tracking, Browser Tracking, or YouTube Tracking anytime in the web settings.
  - Backend enforces permission flags immediately; requests rejected with `403 Forbidden` if tracking is disabled.

---

##  Repository Structure

```
tracker-phase1-backend/
├── backend/                       # FastAPI REST API Backend
│   ├── alembic/                   # Database migrations
│   ├── app/
│   │   ├── core/                  # DB connection, security (JWT, hashing), config
│   │   ├── models/                # SQLAlchemy models (User, AppUsage, BrowserActivity, YouTubeActivity, Permission)
│   │   ├── routers/               # API routes (auth, tracking, permissions, dashboard)
│   │   ├── schemas/               # Pydantic validation schemas
│   │   └── main.py                # FastAPI entrypoint & CORS configuration
│   ├── .env.example               # Environment variables template
│   └── requirements.txt           # Python dependencies
│
├── frontend/                      # React + Vite Web Dashboard
│   ├── src/
│   │   ├── api/                   # Axios client with JWT interceptors
│   │   ├── components/            # UI components (charts, stat cards, tables)
│   │   ├── context/               # AuthContext for user state
│   │   ├── pages/                 # DashboardPage, LoginPage, SignupPage, SettingsPage
│   │   └── index.css              # Glassmorphic responsive design system
│   ├── package.json               # Node.js dependencies and scripts
│   └── vite.config.js             # Vite development server config
│
├── desktop-agent/                 # Native Desktop Monitoring Daemon
│   ├── agent.py                   # Main CLI agent runner
│   ├── batch_sender.py            # Local queuing and batch dispatching
│   ├── config.json                # User credentials & interval configuration
│   ├── startup.py                 # Windows Startup folder integration
│   ├── window_tracker.py          # Win32 / OS foreground window tracker
│   └── requirements.txt           # Python dependencies (psutil, requests)
│
└── chrome-extension/              # Browser Telemetry Extension
    ├── background.js              # Service worker handling tab updates & batch sync
    ├── youtube-tracker.js         # Content script monitoring YouTube video player
    ├── popup.html / popup.js      # Extension popup UI (status, login, sync button)
    ├── manifest.json              # Manifest V3 configuration
    └── icons/                     # Extension branding icons
```

---

## 🛠️ Prerequisites

Before getting started, make sure you have the following installed:

- **Python**: Version `3.10` or higher ([Download Python](https://www.python.org/))
- **Node.js**: Version `18.x` or `20.x` with `npm` ([Download Node.js](https://nodejs.org/))
- **PostgreSQL**: Version `14` or higher running locally or in the cloud (e.g., Supabase, Neon, AWS RDS)
- **Google Chrome**: (or any Chromium browser like Microsoft Edge, Brave)

---

## Quick Start Guide

### 1. Backend Setup (FastAPI & PostgreSQL)

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd tracker-phase1-backend/backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows PowerShell
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure the environment file (`.env`):
   Create a `.env` file in the `backend/` directory:
   ```ini
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/tracker_db
   SECRET_KEY=your_super_secret_jwt_random_key_here
   ```
   *(Ensure the PostgreSQL database `tracker_db` is created in your PostgreSQL instance.)*

5. Run database migrations:
   ```bash
   alembic upgrade head
   ```

6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - API will be accessible at: **`http://localhost:8000`**
   - Interactive Swagger API docs: **`http://localhost:8000/docs`**

---

### 2. Frontend Setup (React + Vite)

1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd tracker-phase1-backend/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   - Open your browser at: **`http://localhost:5173`**
   - Register a new account on the Signup page (`/signup`).

---

### 3. Desktop Agent Setup (Python Background Daemon)

The Desktop Agent tracks active application windows and sends usage intervals to the backend.

1. Open a terminal and navigate to `desktop-agent/`:
   ```bash
   cd tracker-phase1-backend/desktop-agent
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Edit `config.json` with your account credentials:
   ```json
   {
     "backend_url": "http://127.0.0.1:8000",
     "email": "your_registered_email@example.com",
     "password": "your_password",
     "access_token": "",
     "poll_interval_seconds": 1.0,
     "min_duration_seconds": 1,
     "batch_size": 5,
     "flush_interval_seconds": 30,
     "ignored_apps": [
       "LockApp.exe",
       "SearchHost.exe",
       "ShellExperienceHost.exe",
       "ScreenClippingHost.exe"
     ]
   }
   ```

4. Verify window detection with a quick test:
   ```bash
   python agent.py --test
   ```

5. Run the Desktop Agent:
   ```bash
   python agent.py
   ```
   *(To stop the agent, press `Ctrl + C`. Unsent intervals will safely flush before exiting.)*

6. *(Optional)* Install agent to launch automatically upon Windows user login:
   ```bash
   python agent.py --install-startup
   ```
   *(To remove from startup: `python agent.py --uninstall-startup`)*

---

### 4. Chrome Extension Setup (Manifest V3)

The extension tracks browser page visits and YouTube playback.

1. Open **Google Chrome** and enter in the address bar:
   ```
   chrome://extensions
   ```
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked** (top-left button).
4. Select the `tracker-phase1-backend/chrome-extension` folder.
5. *(Recommended)* Enable Incognito tracking:
   - Click **Details** on the installed *Productivity & Activity Tracker* card.
   - Toggle **Allow in incognito** to **ON**.
6. Connect the extension:
   - Click the extension puzzle icon in Chrome and pin **Productivity Tracker**.
   - Click the extension icon to open the popup.
   - Enter your email and password, then click **Connect & Login**.
   - The status badge will change to **Connected**.

---

## How to Use the System

1. **Sign Up / Log In**:
   - Visit `http://localhost:5173/signup` and create an account.
2. **Connect Trackers**:
   - Configure the desktop agent `config.json` with your credentials and run `python agent.py`.
   - Log in to the Chrome extension via its popup window.
3. **Do Your Normal Work**:
   - Code in your editor, browse websites, watch tutorials on YouTube.
   - Telemetry batches are automatically collected and dispatched every 30 seconds.
4. **View Live Analytics**:
   - Visit `http://localhost:5173` to see:
     - Total time spent today vs. 7-day average.
     - Stacked bar charts ranking top applications.
     - Usage timeline charts.
     - Domain visit counts.
     - Watched YouTube videos with duration timestamps.
5. **Manage Privacy**:
   - Go to `http://localhost:5173/settings`.
   - Toggle tracking categories (App, Browser, YouTube) off whenever you want private sessions.

---

## 🔌 REST API Endpoints

The FastAPI backend provides structured REST endpoints:

### Authentication (`/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/signup` | Register new user account | No |
| `POST` | `/auth/login` | Authenticate and obtain JWT token | No |
| `POST` | `/auth/refresh` | Refresh expired access token | No |
| `GET` | `/auth/me` | Fetch authenticated user profile | Yes (Bearer) |
| `POST` | `/auth/change-password` | Update current account password | Yes (Bearer) |

### Telemetry Ingestion (`/track`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/track/app-usage` | Ingest single or batch desktop app usage sessions | Yes (Bearer) |
| `POST` | `/track/app-usage/batch` | Explicit batch endpoint for desktop sessions | Yes (Bearer) |
| `POST` | `/track/browser-activity` | Ingest single or batch browser URL visits | Yes (Bearer) |
| `POST` | `/track/browser-activity/batch` | Explicit batch endpoint for browser visits | Yes (Bearer) |
| `POST` | `/track/youtube-activity` | Ingest YouTube video watch duration record | Yes (Bearer) |

### Privacy & Permissions (`/permissions`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/permissions` | Retrieve current user's tracking permissions | Yes (Bearer) |
| `PUT` | `/permissions` | Update `app_tracking`, `browser_tracking`, or `youtube_tracking` | Yes (Bearer) |

### Dashboard Analytics (`/dashboard`)
| Method | Endpoint | Query Params | Description |
|---|---|---|---|
| `GET` | `/dashboard/summary` | — | Summary KPIs (today, week, month durations, totals) |
| `GET` | `/dashboard/apps` | `range` (`today`,`24h`,`7d`,`30d`,`all`) | App durations ranked with percentage distribution |
| `GET` | `/dashboard/browser` | `range` | Domain visit statistics and visit counts |
| `GET` | `/dashboard/browser-history` | `range`, `limit` | Chronological list of browser URL visits |
| `GET` | `/dashboard/youtube` | `range` | YouTube videos watched, total watch duration, channel details |
| `GET` | `/dashboard/timeline` | `range` | Daily timeline data points for graphical visualization |

---

## Privacy & Security

- **Strict Access Control**: All telemetry endpoints are protected with standard OAuth2 Bearer JWT authentication tokens.
- **Granular Privacy Flags**: Users can independently disable App Tracking, Browser Tracking, or YouTube Tracking. When a permission is disabled, the backend immediately responds with `403 Forbidden` and does not save the record.
- **Local Data Buffering**: Desktop and browser extensions maintain local queues so no telemetry is lost during network dropouts.
- **Domain Sanitization**: The browser tracker extracts top-level domains to prevent inadvertent tracking of sensitive query parameters in general browser statistics.

---

## Troubleshooting & FAQ

#### 1. Backend database connection fails on startup
- Make sure PostgreSQL service is running:
  - Windows: Verify `postgresql-x64` in Services.
  - Linux/macOS: `sudo systemctl status postgresql` or `brew services list`.
- Check that the `DATABASE_URL` in `backend/.env` is correct and matches your PostgreSQL user, password, port, and database name.

#### 2. Desktop Agent gives `403 Forbidden` when syncing
- Check your Privacy Settings on the Web Dashboard (`/settings`). Ensure that **Application Tracking** is enabled.

#### 3. Chrome Extension is not recording Incognito tabs
- Chrome disables extensions in Incognito mode by default.
- Go to `chrome://extensions` &rarr; click **Details** on the Tracker extension &rarr; enable **Allow in incognito**.

#### 4. Frontend shows empty charts after first login
- You need active activity data. Keep the desktop agent running and browse for a couple of minutes, or click **Sync Now** in the Chrome extension popup.
- Select the `today` or `all` range filter in the dashboard header.

---

## License

This project is licensed under the MIT License. Feel free to customize and extend it for your personal or organizational productivity tracking needs!
