# 📈 Stock Analyser – Quantitative Swing Trading Screener

A full-stack stock screening platform that combines technical trend analysis, corporate earnings growth, and market volume behavior to identify high-conviction swing trading opportunities.

The system automatically scans equities, evaluates technical momentum using moving averages and RSI, analyzes company fundamentals through YoY profit growth, and presents actionable insights through an interactive web dashboard.

---

## 🚀 Key Features

### Technical Analysis Engine

* 50-Day Exponential Moving Average (EMA)
* 200-Day Exponential Moving Average (EMA)
* 14-Period Relative Strength Index (RSI)
* Volume Surge Detection using 20-Day Volume SMA
* Trend Confirmation Rules

### Fundamental Analysis Engine

* Quarterly Financial Statement Extraction
* Net Income Parsing
* Year-over-Year Net Profit Growth Calculation
* Growth Threshold Filtering (>15%)

### Screening Logic

A stock is shortlisted only when it satisfies both:

**Technical Condition**

```text
Price > EMA50 > EMA200
```

**Fundamental Condition**

```text
YoY Net Profit Growth > 15%
```

This dual-filter approach helps eliminate weak momentum stocks while focusing on companies demonstrating both technical strength and earnings expansion.

---

## 🏗 System Architecture

### Backend Stack

* FastAPI
* Python 3.12
* AsyncIO
* Pandas
* yFinance
* Pydantic v2
* Motor (MongoDB Async Driver)
* Uvicorn

### Frontend Stack

* React.js
* Tailwind CSS
* Axios
* CRACO

### Database Layer

* MongoDB
* Scan Persistence
* Fundamental Data Cache
* Historical Scan Tracking

---

## ⚡ Performance Design

The platform is designed for large-scale market scanning.

### Concurrent Processing

Network-bound operations are executed asynchronously using:

```python
asyncio.Semaphore(MAX_CONCURRENCY)
```

This enables parallel processing of multiple tickers while preventing excessive Yahoo Finance requests.

### Non-Blocking Execution

Synchronous operations are isolated using:

```python
asyncio.to_thread(...)
```

allowing the FastAPI event loop to remain responsive.

### Fault Tolerance

* Safe NaN handling
* Fundamental data fallbacks
* Defensive exception handling
* Database timeout protection
* Graceful degradation when external services fail

---

## 📊 Technical Indicators

### Exponential Moving Averages

The system computes:

* EMA 50
* EMA 200

to determine long-term trend structure.

### Relative Strength Index (RSI)

A standard 14-period RSI is calculated.

| RSI Range | Interpretation |
| --------- | -------------- |
| > 70      | Overbought     |
| < 30      | Oversold       |
| 30–70     | Neutral        |

### Volume Surge Detection

Institutional participation is estimated by comparing current volume against a 20-day moving average.

```text
Volume Spike = Current Volume > 2 × Volume SMA20
```

---

## 📈 Fundamental Analysis

The engine extracts quarterly net income directly from Yahoo Finance financial statements.

Supported labels include:

```python
[
    "Net Income",
    "Net Income Common Stockholders",
    "NetIncome",
    "Net Income Applicable To Common Shares"
]
```

Growth is calculated as:

```text
((Current Quarter Net Income
-
Same Quarter Last Year Net Income)
/
Same Quarter Last Year Net Income)
× 100
```

---

## 📁 Project Structure

```text
Stock_analyser/
│
├── backend/
│   ├── config/
│   │   └── universe.py
│   │
│   ├── services/
│   │   └── market_data_service.py
│   │
│   ├── repositories/
│   ├── data/
│   ├── models.py
│   ├── history_endpoint.py
│   ├── main.py
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── services/
    │   ├── App.js
    │   └── index.js
```

---

## 🔄 Workflow

```text
User Request
      │
      ▼
React Dashboard
      │
      ▼
FastAPI Backend
      │
      ▼
Yahoo Finance Data Fetch
      │
      ▼
Technical Indicator Calculation
      │
      ▼
Fundamental Growth Analysis
      │
      ▼
Screening Engine
      │
      ▼
JSON API Response
      │
      ▼
Interactive Dashboard
```

---

## 📌 Future Roadmap

* Nifty 100 Universe
* Nifty 250 Universe
* Nifty 500 Universe
* Historical Scan Database
* AI Generated Trading Thesis
* Portfolio Tracking
* Watchlist Management
* Automated Scheduled Scans
* Advanced Charting & Backtesting

---

## 🛠 Local Development

### Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn main:app --reload
```

### Frontend

```bash
cd frontend

npm install

npm start
```

---

## Disclaimer

This project is intended for educational and research purposes only. It does not constitute financial advice, investment recommendations, or trading guidance. Always conduct independent analysis before making investment decisions.
