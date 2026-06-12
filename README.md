<div align="center">

# 🚗 Car Market

**A full-stack car marketplace platform built as a Final Year Project (PFE)**

[![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20?style=flat-square&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://mysql.com)

</div>

---

## 📖 Project Overview

**Car Market** is a comprehensive car marketplace web application that allows users to browse, search, and purchase vehicles online. It features a role-based access system with distinct dashboards for clients, managers, and administrators, along with an integrated AI-powered recommendation engine.

This project was developed as a Final Year Project (Projet de Fin d'Études — PFE), demonstrating mastery of modern full-stack web development.

## ✨ Main Features

- **Client Experience:** Browse vehicles with advanced filters, view detailed galleries, place orders, and receive AI-powered car recommendations.
- **Manager Tools:** Dedicated dashboard to view cars, orders, client records, and manage contact requests.
- **Admin Control:** Full CRUD management of inventory, user roles, order workflows, and business analytics.
- **AI Integration:** Personalized car suggestions via a Python FastAPI recommendation service.
- **Multi-language Support:** Available in English, French, and Arabic.

## 🏗️ Architecture

The platform uses a hybrid microservices architecture:
- **React Frontend (Vite):** The main user interface.
- **Next.js API (V2):** Modern data layer using Prisma ORM.
- **Laravel Backend (V1):** Legacy API and administrative logic.
- **FastAPI Engine:** AI recommendation service.
- **MySQL Database:** Centralized data storage.

## 🛠️ Technologies Used

- **Frontend:** React 19, Vite, Tailwind CSS, React Router, i18next
- **Backend APIs:** Laravel 12, Next.js 15, Prisma ORM
- **AI Service:** Python 3.11+, FastAPI
- **Database:** MySQL 8.0

## ⚙️ Quick Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MARYEMBOUCHAMMACHTESTN24-arch/car-market13.git
   cd car-market13
   ```

2. **Start Laravel Backend:**
   ```bash
   cd car-market-backend
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate --seed
   php artisan serve --port=8000
   ```

3. **Start Next.js API:**
   ```bash
   cd ..
   npm install
   npx next dev -p 3000
   ```

4. **Start React Frontend:**
   ```bash
   cd car-market-frontend
   npm install
   npm run dev
   ```

*(Optional: The Python AI Engine can be started in `ai-engine/` using `uvicorn app:app --port 9002 --reload`)*

## 👩‍💻 Author

**Maryem Bouchammach**
- GitHub: [@MARYEMBOUCHAMMACHTESTN24-arch](https://github.com/MARYEMBOUCHAMMACHTESTN24-arch)
- Project Type: Final Year Project (PFE) — 2025/2026
