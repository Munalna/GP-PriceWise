<div align="center">
  <img src="assets/logo.png" alt="PriceWise Logo" width="180" />

  <h1>PriceWise</h1>

  <p><strong>Smart, localized pricing advisory platform for cafés and restaurants in Saudi Arabia.</strong></p>

  <p>
    <a href="https://gp-price-wise.vercel.app/">
      <img src="https://img.shields.io/badge/%F0%9F%8C%90_Live_Demo-Try_PriceWise-6C2A7E?style=for-the-badge" alt="Live Demo" />
    </a>
  </p>

  <p><em>👉 Try it live: <a href="https://gp-price-wise.vercel.app/">gp-price-wise.vercel.app</a></em></p>
</div>

---

PriceWise is a full-stack web application that helps small and medium-sized Saudi cafés move from guesswork to **data-driven pricing**. It combines a café's real internal costs with external market signals — competitor prices and seasonal demand — and uses an intelligent pricing engine to recommend prices that stay both **profitable** and **competitive**.

> 🎓 Graduation Project — Part II (SWE 497) · Group 18 · Software Engineering Department, CCIS, King Saud University.

---

## 📖 About

Cafés in Saudi Arabia operate in a fast-moving market shaped by seasonal demand shifts (Ramadan, national holidays), rising operational costs, and intense local competition. Many owners still rely on manual, static pricing that lacks accuracy and real-time insight — leading to underpricing, overpricing, and lost profit.

PriceWise addresses this by connecting **internal financial data** (fixed and variable costs such as rent, salaries, and ingredients) with **external market factors** (competitor prices and seasonal trends), then generating optimized price recommendations through a hybrid pricing engine and AI reasoning. Owners get clear dashboards, profit alerts, and exportable reports — all from a single platform.

**Primary user:** the café Business Owner, who can manage products and costs, import sales data, view analytics, compare market prices, and receive pricing recommendations.

---

## ✨ Key Features

- **Cost Management** — Track fixed costs (rent, salaries) and variable cost components, with automatic allocation of fixed costs across the product catalog.
- **Product & Recipe Setup** — Add products, define their cost components, and assign base costs.
- **AI Pricing Engine** — A hybrid recommendation engine that combines cost calculation, competitor comparison, pricing rules, and risk analysis, enriched with **Gemini AI** reasoning to produce a recommended price plus justification, risk explanation, and suggested action.
- **Seasonal Pricing Rules** — Define and manage pricing rules for key local periods such as Ramadan and holidays.
- **Market Price Matching** — Compare product prices against competitor market data to gauge competitiveness.
- **Sales Analytics** — Import sales data and explore product performance through interactive dashboards.
- **PDF Reporting** — Export professionally formatted reports (pricing summaries, competitor comparisons, profit margin analysis).
- **Risk & Profit Alerts** — Flag products that may be overpriced, underpriced, or financially risky.
- **Account Management** — Registration, login, and password reset.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React.js · Bootstrap / React-Bootstrap |
| **Backend** | Node.js · Express · ES Modules · MVC architecture |
| **Database & Auth** | Supabase (PostgreSQL) — JWT auth, Row-Level Security, realtime |
| **AI** | Google Generative AI API — Gemini 2.0 Flash (`aiPricingService.js`) |
| **Reporting** | PDFKit (`pdfService.js`) |
| **Deployment** | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended) and npm
- A [Supabase](https://supabase.com/) project (URL + anon key)
- A Google Generative AI API key (for the pricing engine)

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the app

```bash
# Start the backend (from /backend) — runs with nodemon
npm run dev

# Start the frontend (from /frontend)
npm start
```

Then configure your environment variables as described in **Configuration** below.

---

## ⚙️ Configuration

Copy the provided example files and fill in your own values.

### Frontend `.env`

Use `frontend/.env.example` as a template:

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_FRONTEND_URL` — used for the reset redirect, e.g. `http://localhost:3000`

### Backend `.env`

Use `backend/.env.example` as a template:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — *optional*, for Admin API link generation
- `FRONTEND_URL` — fallback redirect target

> ⚠️ **Security warning:** never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code or public repositories.

---

## 🔐 Forgot Password & Auth

The `ForgotPassword` flow sends users to:

```
<REACT_APP_FRONTEND_URL>/reset-password
```

### Password Reset Endpoints

**`POST /api/auth/forgot-password`**

- Body: `{ "email": "user@example.com", "redirectTo": "http://localhost:3000/reset-password" }`
- Uses Admin API link generation if `SUPABASE_SERVICE_ROLE_KEY` exists; otherwise falls back to the Supabase hosted reset email.

**`POST /api/auth/reset-password`**

- Informational endpoint.
- The actual password update happens on the frontend `/reset-password` route via the recovery session:

  ```js
  supabase.auth.updateUser({ password: newPassword })
  ```

---

## 👩‍💻 Team — Group 18

| Name | Student ID | Role |
|---|---|---|
| **Muntaha Alnasser** | 444200905 | Team Leader |
| Sarah Albuqami | 444200576 | Member |
| Rowa Alshehri | 444200723 | Member |
| Jood Alajlan | 444201217 | Member |
| Tala Alrajeh | 444200459 | Member |

**Project Advisor:** L. Sarah Alkoblan

Software Engineering Department · College of Computer and Information Sciences (CCIS) · King Saud University
