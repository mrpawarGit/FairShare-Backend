# 🌐 FairShare Backend

FairShare Backend is a **Splitwise-style shared expense management system**.
It uses **Firebase Authentication**, **PostgreSQL**, **Prisma ORM**, and **Node.js + Express** to provide secure and scalable APIs for:

* Groups
* Shared expenses
* Splits (EQUAL, EXACT, PERCENT)
* Balances
* Debt simplification
* Settlements

**Live API:** [https://fairshare-backend-zzxd.onrender.com](https://fairshare-backend-zzxd.onrender.com)

---

# 📦 Tech Stack

| Layer              | Technology                           |
| ------------------ | ------------------------------------ |
| **Backend**        | Node.js, Express                     |
| **Database**       | PostgreSQL (Render Cloud DB)         |
| **ORM**            | Prisma                               |
| **Authentication** | Firebase Authentication (Admin SDK)  |
| **Hosting**        | Render Web Service                   |
| **Utilities**      | cors, dotenv, morgan, firebase-admin |

---
# 📂 Project Structure

```
backend-app
│   .env
│   .gitignore
│   fairshare-backend-firebase-adminsdk.json
│   package.json
│   package-lock.json
│
├── prisma
│   └── schema.prisma
│
└── src
    │   app.js
    │   server.js
    │
    ├── config
    │   ├── db.js
    │   └── firebase.js
    │
    ├── middlewares
    │   └── auth.js
    │
    └── modules
        ├── balances
        │   ├── balance.controller.js
        │   ├── balance.routes.js
        │   ├── simplify.controller.js
        │   └── simplify.routes.js
        │
        ├── expenses
        │   ├── expense.controller.js
        │   └── expense.routes.js
        │
        ├── groups
        │   ├── group.controller.js
        │   └── group.routes.js
        │
        ├── settlements
        │   ├── settlement.controller.js
        │   └── settlement.routes.js
        │
        └── users
            ├── user.controller.js
            └── user.routes.js
```

This structure follows **clean architecture principles** with:

* Separation of concerns
* Independent modules
---

# 🧰 Local Development Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/mrpawarGit/FairShare-Backend.git
cd FairShare-Backend
cd backend-app
```

## 2️⃣ Install Dependencies

```bash
npm install
```

## 3️⃣ Create `.env` File

```
PORT=3000

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME"

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 4️⃣ Sync Database Schema

```bash
npx prisma db push
```

## 5️⃣ Start Development Server

```bash
npm run dev
```

Health check:

```
GET http://localhost:3000/health
```

---

# ⭐ Features

### 🔐 Authentication (Firebase)

* No custom passwords.
* Users log in using Firebase.
* Backend validates Firebase ID token + creates user in DB.

### 👥 Groups

* Create groups.
* Add or remove members (Admin only).
* View all groups you belong to.
* Member role system (ADMIN / MEMBER).

### 💰 Expenses

* Create expenses inside or outside groups.
* Define payer + participants.
* Supported split types:

  * **EQUAL**
  * **EXACT**
  * **PERCENT**
* Update or delete (creator or payer only).

### 📊 Balances

Backend automatically calculates:

* How much each user owes others.
* How much they are owed.
* Group-by-group balances.
* Global balances.

### 🔄 Debt Simplification (Mandatory Feature)

* Minimizes number of transactions required to settle all debts.
* Removes circular debts.
* Works globally & per-group.
* Does **not** modify actual DB values.

### 🧾 Settlements

* Users can record real payments.
* Settlements affect balance calculations.
* View settlement history for each group.

---


# 🔐 Authentication Guide (Postman-Friendly)

You must authenticate via **Firebase Authentication REST API**.

## 1️⃣ Sign Up

```
POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=YOUR_WEB_API_KEY
Content-Type: application/json

{
  "email": "example@test.com",
  "password": "password123",
  "returnSecureToken": true
}
```

## 2️⃣ Log In

```
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_WEB_API_KEY
Content-Type: application/json

{
  "email": "example@test.com",
  "password": "password123",
  "returnSecureToken": true
}
```

Response includes:

```
idToken
```

Use it for every request:

```
Authorization: Bearer <idToken>
```

---

# 📘 API Overview (High-Level)

### 👤 User

| Method | Endpoint        | Description              |
| ------ | --------------- | ------------------------ |
| GET    | `/api/users/me` | Get current user profile |

---

### 👥 Groups

| Method | Endpoint                               | Description      |
| ------ | -------------------------------------- | ---------------- |
| POST   | `/api/groups`                          | Create group     |
| GET    | `/api/groups`                          | List user groups |
| GET    | `/api/groups/:groupId`                 | Group details    |
| GET    | `/api/groups/:groupId/members`         | Group members    |
| POST   | `/api/groups/:groupId/members`         | Add member       |
| DELETE | `/api/groups/:groupId/members/:userId` | Remove member    |

---

### 💰 Expenses

| Method | Endpoint                       | Description     |
| ------ | ------------------------------ | --------------- |
| POST   | `/api/expenses`                | Create expense  |
| GET    | `/api/expenses/group/:groupId` | Group expenses  |
| GET    | `/api/expenses/:expenseId`     | Expense details |
| PUT    | `/api/expenses/:expenseId`     | Update expense  |
| DELETE | `/api/expenses/:expenseId`     | Delete expense  |

---

### 📊 Balances

| Method | Endpoint                       | Description     |
| ------ | ------------------------------ | --------------- |
| GET    | `/api/balances/me`             | Global balances |
| GET    | `/api/balances/group/:groupId` | Group balances  |

---

### 🔄 Debt Simplification

| Method | Endpoint                                  | Description             |
| ------ | ----------------------------------------- | ----------------------- |
| GET    | `/api/balances/simplified`                | Global simplified debts |
| GET    | `/api/balances/simplified/group/:groupId` | Group simplified debts  |

---

### 🧾 Settlements

| Method | Endpoint                          | Description        |
| ------ | --------------------------------- | ------------------ |
| POST   | `/api/settlements`                | Record payment     |
| GET    | `/api/settlements/group/:groupId` | Settlement history |

---

# 🧠 How the DB & Workflow Actually Works (Simple Explanation)

### 1️⃣ Firebase handles user authentication

Users never touch backend passwords.
Backend only **verifies tokens** using Firebase Admin.

### 2️⃣ PostgreSQL stores:

* Users
* Groups
* Group members
* Expenses
* Participants
* Settlements

### 3️⃣ Prisma reads DB → Backend computes:

* How much each user owes
* How much they are owed
* Net balances per group & globally

### 4️⃣ Debt Simplification

Runs a **greedy algorithm** to minimize money transfers.

### 5️⃣ Settlements

When someone pays someone else, it gets recorded → balances become more accurate.

---

# 🧾 In Simple Words 

> **FairShare Backend is a Splitwise-like backend system.
> Users authenticate with Firebase, create groups, add expenses, split them fairly, and the backend calculates who owes whom.
> It also simplifies the debts so everyone has to make the minimum number of payments.
> Settlements record real payments and update balances.
> Everything runs on PostgreSQL + Prisma and is deployed on Render.**

---
