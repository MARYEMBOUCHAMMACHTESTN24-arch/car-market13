<div align="center">

# 🚗 Car Market — Plateforme de Vente de Véhicules

**A full-stack car marketplace platform built as a Final Year Project (PFE)**

[![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20?style=flat-square&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://mysql.com)

</div>

---

## 📖 Project Overview

**Car Market** is a comprehensive car marketplace web application that allows users to browse, search, and purchase vehicles online. The platform features a role-based access system with distinct dashboards for **clients**, **managers**, and **administrators**, along with an integrated **AI-powered recommendation engine**.

This project was developed as a **Final Year Project (Projet de Fin d'Études — PFE)** and demonstrates mastery of modern full-stack web development across three separate technology layers.

---

## ✨ Key Features

### 🛒 For Clients
- Browse and search vehicles with advanced filters (brand, price, year, fuel type, category)
- View detailed car pages with image galleries
- Place and track orders
- Receive AI-powered car recommendations
- Multi-language interface (English, French, Arabic)
- Favorites list and personal dashboard

### 🔧 For Managers
- Dedicated manager dashboard
- View cars, orders, and client records (read-only)
- Manage customer messages and contact requests

### 👑 For Administrators
- Full CRUD control over the car inventory
- User and role management
- Order approval / rejection workflow
- Promotions and featured listings management
- Business analytics dashboard

### 🤖 AI Engine
- FastAPI-based Python service
- Car recommendation engine using similarity scoring
- Advisor chatbot for buyer guidance

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                     Browser                         │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │   React Frontend       │  (Vite — port 5173)
         │   car-market-frontend/ │
         └───┬───────────────┬───┘
             │               │
    ┌────────▼──────┐  ┌─────▼────────────┐
    │ Laravel API   │  │  Next.js API      │
    │ (PHP — :8000) │  │  (Node.js — :3000)│
    │ Legacy routes │  │  V2 + Prisma ORM  │
    └────────┬──────┘  └─────┬─────────────┘
             │               │
    ┌────────▼───────────────▼────────────┐
    │              MySQL Database          │
    │          (automarket / car_market)   │
    └──────────────────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │    AI Engine           │  (FastAPI — port 9002)
         │    ai-engine/          │
         └───────────────────────┘
```

### Project Structure

```
car-market13/
│
├── car-market-frontend/        # React + Vite frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route-level page components
│   │   ├── services/           # API service layer (axios)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── utils/              # Helpers & RBAC utilities
│   │   └── i18n/               # Translations (EN/FR/AR)
│   └── public/                 # Static assets & car images
│
├── car-market-backend/         # Laravel REST API (V1)
│   ├── app/
│   │   ├── Http/Controllers/   # API controllers
│   │   ├── Models/             # Eloquent models
│   │   └── Middleware/         # Auth & permission middleware
│   ├── database/
│   │   ├── migrations/         # Database schema
│   │   └── seeders/            # Seed data & roles
│   └── routes/api.php          # API route definitions
│
├── src/                        # Next.js API layer (V2)
│   ├── app/api/                # Next.js API route handlers
│   ├── lib/                    # Prisma client & schemas
│   └── services/               # Business logic services
│
├── ai-engine/                  # Python AI recommendation service
│   ├── app.py                  # FastAPI application
│   └── requirements.txt        # Python dependencies
│
├── prisma/                     # Prisma ORM schema (if present)
├── package.json                # Next.js dependencies
└── .gitignore
```

---

## 🛠️ Technologies Used

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | React | 19.x |
| **Frontend Build** | Vite | 6.x |
| **Styling** | Tailwind CSS | 3.x |
| **Routing** | React Router DOM | 7.x |
| **Internationalisation** | i18next | — |
| **Backend (V1)** | Laravel | 12.x |
| **Backend (V2)** | Next.js | 15.x |
| **ORM (V2)** | Prisma | — |
| **Auth** | Laravel Sanctum | — |
| **Permissions** | Spatie Laravel Permission | — |
| **AI Engine** | FastAPI + Python | 3.11+ |
| **Database** | MySQL | 8.0 |
| **Language** | PHP | 8.2+ |
| **Language** | TypeScript / JavaScript | — |

---

## ⚙️ Installation & Setup

### Prerequisites

- **PHP** 8.2+ with Composer
- **Node.js** 18+ with npm
- **Python** 3.11+
- **MySQL** 8.0 (XAMPP recommended for local dev)

---

### 1. Clone the Repository

```bash
git clone https://github.com/MARYEMBOUCHAMMACHTESTN24-arch/car-market13.git
cd car-market13
```

---

### 2. Laravel Backend Setup

```bash
cd car-market-backend

# Install PHP dependencies
composer install

# Create environment file
cp .env.example .env
php artisan key:generate

# Configure your database in .env
# DB_DATABASE=car_market
# DB_USERNAME=root
# DB_PASSWORD=

# Run migrations and seed data
php artisan migrate
php artisan db:seed

# Start the server
php artisan serve --port=8000
```

The Laravel API will be available at `http://localhost:8000`

---

### 3. React Frontend Setup

```bash
cd car-market-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

### 4. Next.js V2 API Setup (Optional)

```bash
# From the project root
npm install

# Create .env file (copy from example and set DATABASE_URL)
# DATABASE_URL="mysql://root:@127.0.0.1:3306/automarket"

# Start the Next.js API server
npx next dev -p 3000
```

---

### 5. AI Engine Setup (Optional)

```bash
cd ai-engine

# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Start the AI service
uvicorn app:app --host 0.0.0.0 --port 9002 --reload
```

---

## 🚀 Running All Services

Open separate terminals for each service:

```bash
# Terminal 1 — Laravel API (V1)
cd car-market-backend && php artisan serve --port=8000

# Terminal 2 — Next.js API (V2) — optional
cd car-market13 && npx next dev -p 3000

# Terminal 3 — React Frontend
cd car-market-frontend && npm run dev

# Terminal 4 — AI Engine — optional
cd ai-engine && uvicorn app:app --port 9002 --reload
```

---

## 🔐 Default Accounts

After running `php artisan db:seed`:

| Role | Email | Password |
|---|---|---|
| Administrator | admin@test.com | 123456 |
| Manager | manager@admin.com | password |
| Client | *(register a new account)* | — |

---

## 🌐 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/register` | Register new user |
| `POST` | `/api/login` | User login |
| `POST` | `/api/logout` | Logout |

### Cars
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/cars` | List cars (filters supported) | Public |
| `GET` | `/api/cars/{id}` | Get single car | Public |
| `POST` | `/api/cars` | Create car | Admin |
| `PUT` | `/api/cars/{id}` | Update car | Admin |
| `DELETE` | `/api/cars/{id}` | Delete car | Admin |

### Orders
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/orders` | List orders | Auth |
| `POST` | `/api/orders` | Place order | Auth |
| `PUT` | `/api/orders/{id}` | Update order status | Admin |

---

## 📸 Screenshots

> _Screenshots will be added after deployment._

| Page | Description |
|---|---|
| Home | Hero section with featured vehicles |
| Cars Listing | Grid view with brand / price / year filters |
| Car Detail | Full gallery, specs, and order button |
| Admin Dashboard | Car management, orders, and analytics |
| Client Dashboard | Orders, favorites, profile |
| AI Recommendation | Personalized car suggestions |

---

## 🔒 Role & Permission System

The platform uses **Spatie Laravel Permission** for fine-grained access control:

| Action | Client | Manager | Admin |
|---|---|---|---|
| View cars | ✅ | ✅ | ✅ |
| Place orders | ✅ | ❌ | ✅ |
| Add cars | ❌ | ❌ | ✅ |
| Edit cars | ❌ | ❌ | ✅ |
| Delete cars | ❌ | ❌ | ✅ |
| View all orders | ❌ | ✅ | ✅ |
| Manage users | ❌ | ❌ | ✅ |

---

## 👩‍💻 Author

**Maryem Bouchammach**
- GitHub: [@MARYEMBOUCHAMMACHTESTN24-arch](https://github.com/MARYEMBOUCHAMMACHTESTN24-arch)
- Project Type: Final Year Project (PFE) — 2025/2026

---

## 📄 License

This project is developed for academic purposes as a Final Year Project (PFE).  
All rights reserved © 2026 Maryem Bouchammach.
