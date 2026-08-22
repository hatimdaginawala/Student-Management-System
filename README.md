# Student Management System (SMS)

A full-stack, comprehensive **Institute & Student Management System** built with Node.js, Express, MongoDB (MEN stack), and modern vanilla HTML5/CSS3/JavaScript. This system provides complete administrative tools for educational institutes to manage students, batches, enrollments, fee payments, inquiries, staff, expenses, certificates, and analytical financial/operational reports.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [1. Authentication & User Management](#1-authentication--user-management)
  - [2. Student Management & Ledger](#2-student-management--ledger)
  - [3. Batch & Course Management](#3-batch--course-management)
  - [4. Enrollment & Fee Tracking](#4-enrollment--fee-tracking)
  - [5. Payment Processing & Receipt Generation](#5-payment-processing--receipt-generation)
  - [6. Certificate Lifecycle Management](#6-certificate-lifecycle-management)
  - [7. Inquiry & Lead Management](#7-inquiry--lead-management)
  - [8. Staff & HR Management](#8-staff--hr-management)
  - [9. Expense Tracking](#9-expense-tracking)
  - [10. Analytics Dashboard & Reports](#10-analytics-dashboard--reports)
- [Tech Stack](#tech-stack)
- [Project Architecture & Directory Structure](#project-architecture--directory-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Database Seeding & Default Credentials](#database-seeding--default-credentials)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Security Features](#security-features)
- [License & Contribution](#license--contribution)

---

## 🌟 Overview

The **Student Management System** is designed to streamline administrative workflows for coaching centers, training academies, and educational institutes. It manages the entire lifecycle of a student from initial inquiry and admission to course completion, fee collections, certificate issuance, and institute expense management. Role-based access control (RBAC) ensures strict security between Super Admins and regular Admins.

---

## ✨ Key Features

### 1. Authentication & User Management
- **Role-Based Access Control (RBAC)**: Support for `Super Admin` and `Admin` roles.
- **Secure Authentication**: JWT-based session tokens and bcrypt password hashing.
- **User Administration**: Create, update, activate/deactivate, and manage system users.

### 2. Student Management & Ledger
- Detailed student profiles including personal details, parent information, Aadhar card numbers, and contact details.
- Comprehensive **Student Financial Ledger** showing course enrollments, total fees, discount history, payments made, and current pending balances.
- PDF student ledger export capabilities.

### 3. Batch & Course Management
- Track course details, total fees, course duration, start/end dates, class schedules, and assigned faculty.
- Batch status tracking (`Upcoming`, `Running`, `Completed`, `Cancelled`).
- Track capacity, room assignments, total revenue generated per batch, and enrolled students list.

### 4. Enrollment & Fee Tracking
- Flexible student course enrollment with customizable discounts.
- Automatic computation of total fee payable, paid amounts, and remaining dues.
- Support for enrollment status management (`Running`, `Completed`, `Dropped`).

### 5. Payment Processing & Receipt Generation
- Record payments across multiple payment modes (Cash, UPI, Bank Transfer, Card, Cheque).
- Automatic unique receipt number generation (`RCP...`).
- Instant **PDF Receipt Generation** using PDFKit with download capability.

### 6. Certificate Lifecycle Management
- Manage end-to-end certificate workflow (`Certificate Pending` -> `Applied` -> `Received`).
- Record certificate application date, issuance date, and unique certificate serial numbers.
- Dedicated view to issue and track student completion certificates.

### 7. Inquiry & Lead Management
- Capture prospective student inquiries, courses of interest, and source of lead.
- Status tracking (`New`, `Follow Up`, `Converted`, `Closed`).
- Follow-up scheduling and conversion tracking.

### 8. Staff & HR Management
- Maintain staff directories, designations, qualification records, joining dates, and contact details.
- Active/Inactive employment status tracking.

### 9. Expense Tracking
- Category-wise institute expense management (Salaries, Rent, Utilities, Maintenance, Marketing, Supplies, Miscellaneous).
- Filter expenses by date range and payment method.

### 10. Analytics Dashboard & Reports
- **Interactive Dashboard**: Real-time KPI summary cards (Total Students, Active Batches, Total Revenue Collected, Pending Dues), recent admissions, and recent transactions.
- **Reporting Engine**:
  - Pending Fees Report
  - Payment History & Daily/Monthly Collection Summary
  - Batch Revenue Analysis
  - Student-wise and Batch-wise collection breakdowns
  - Export reports to Excel (`.xlsx`) or PDF.

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **PDF Generation**: `pdfkit`
- **Spreadsheet Export**: `xlsx`
- **File Processing**: `express-fileupload` / `multer`
- **Security & Utilities**: `helmet`, `cors`, `express-rate-limit`, `morgan`, `dotenv`

### Frontend
- **Structure**: Vanilla HTML5, Single/Multi-Page Modular Interface
- **Styling**: Modern CSS3 (CSS Variables, Flexbox/Grid, Dark/Light Mode support)
- **Scripting**: Modular Vanilla JavaScript (ES6+) with custom REST API client (`api.js`, `auth.js`)
- **Icons**: Inline scalable SVG icons

---

## 📁 Project Architecture & Directory Structure

```
.
├── backend/
│   ├── config/
│   │   └── db.js              # Database connection setup
│   ├── controllers/           # Request handlers for all modules
│   │   ├── authController.js
│   │   ├── batchController.js
│   │   ├── dashboardController.js
│   │   ├── enrollmentController.js
│   │   ├── expenseController.js
│   │   ├── inquiryController.js
│   │   ├── paymentController.js
│   │   ├── reportController.js
│   │   ├── staffController.js
│   │   ├── studentController.js
│   │   └── userController.js
│   ├── middleware/            # Security, auth, audit & validation middleware
│   ├── models/                # Mongoose database schemas
│   │   ├── Batch.js
│   │   ├── Enrollment.js
│   │   ├── Expense.js
│   │   ├── Inquiry.js
│   │   ├── Payment.js
│   │   ├── Staff.js
│   │   ├── Student.js
│   │   └── User.js
│   ├── public/                # Uploaded files and static assets
│   ├── routes/                # Express API route declarations
│   ├── seeds/
│   │   └── seedData.js        # Data seeding script
│   ├── utils/                 # PDF generators, Excel exporters & logger
│   ├── app.js                 # Express application configuration
│   ├── server.js              # Server entry point
│   └── package.json
└── frontend/                  # Responsive web interface pages & static assets
    ├── css/
    │   ├── auth.css
    │   ├── dashboard.css
    │   └── style.css
    ├── js/
    │   ├── api.js
    │   ├── auth.js
    │   ├── config.js
    │   ├── dashboard.js
    │   └── ... (module specific UI logic)
    ├── batches.html
    ├── certificates.html
    ├── dashboard.html
    ├── enrollments.html
    ├── expenses.html
    ├── inquiries.html
    ├── login.html
    ├── payments.html
    ├── reports.html
    ├── staff.html
    ├── students.html
    └── users.html
```

---

## ⚙️ Prerequisites

Before running the application, make sure you have the following installed on your machine:

- **Node.js**: v16.x or higher
- **npm**: v8.x or higher
- **MongoDB**: Local MongoDB instance (running on `mongodb://localhost:27017`) or a MongoDB Atlas URI string.

---

## 🚀 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Navigate to the backend directory and install dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file inside the `backend/` directory with the following variables:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/student_management_system
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   ```

---

## 🌱 Database Seeding & Default Credentials

To seed the database with initial sample data (including Super Admin, Admins, sample Batches, Students, Enrollments, and Payments):

```bash
cd backend
npm run seed
```

### Default Login Credentials (from seed data):

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@example.com` | `admin123` |
| **Admin 1** | `rahul.sharma@example.com` | `admin123` |
| **Admin 2** | `priya.patel@example.com` | `admin123` |

---

## 🖥️ Running the Application

### 1. Start the Backend Server
From the `backend/` directory:

- **Development Mode** (with Nodemon hot-reload):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

The backend server will run at `http://localhost:5000`.

### 2. Accessing the Frontend Interface
The Express application serves the frontend pages directly!
Open your web browser and navigate to:

```
http://localhost:5000/
```
(You will be redirected to `http://localhost:5000/login.html`).

---

## 🔗 API Reference Overview

The API endpoints are served under `/api/`:

| Module | Base Endpoint | Description |
| :--- | :--- | :--- |
| **Auth** | `/api/auth` | User login, current profile, password change/reset, logout |
| **Users** | `/api/users` | Manage system users (Super Admin only) |
| **Students** | `/api/students` | Manage student records, certificates, and student ledger |
| **Batches** | `/api/batches` | Create/update batches and query enrolled students/revenue |
| **Enrollments** | `/api/enrollments` | Manage course admissions, fees, and status updates |
| **Payments** | `/api/payments` | Record fee payments and download PDF receipts (`/api/payments/:id/receipt`) |
| **Inquiries** | `/api/inquiries` | Capture and update prospective student leads |
| **Expenses** | `/api/expenses` | Manage operational institute expenses |
| **Staff** | `/api/staff` | Manage staff directory and records |
| **Dashboard** | `/api/dashboard` | Aggregated dashboard KPI statistics and overview data |
| **Reports** | `/api/reports` | Retrieve pending fees, collections, batch revenue, and export Excel/PDF |

---

## 🔒 Security Features

- **JWT Authentication**: Secured endpoints requiring Bearer tokens.
- **Helmet**: HTTP headers protection.
- **Data Sanitization**: Prevents XSS and query injection.
- **Rate Limiting**: IP-based rate limiting on API routes.
- **CORS Protection**: Configurable allowed origins for cross-origin requests.

---

## 📄 License & Contribution

This project is open-source and available for educational and commercial institute management purposes. Contributions, issues, and feature requests are welcome!
