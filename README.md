# FairShare Backend

A backend service for a “Splitwise”-style shared expense app.
Combines Firebase Authentication for user identities, PostgreSQL (hosted on Render) for data, and a REST API in Node.js + Express + Prisma for handling groups, expenses, balances, settlements, and debt simplification.

**Live Deployment**: [https://fairshare-backend-zzxd.onrender.com](https://fairshare-backend-zzxd.onrender.com)

---

## 🚀 Tech Stack & Architecture

* **Backend**: Node.js + Express
* **Database**: PostgreSQL (Render)
* **ORM**: Prisma
* **Authentication**: Firebase Authentication (via Firebase Admin SDK) — no custom password/auth implementation
* **Hosting / Deployment**: Render (Web Service + Postgres)
* **Dependencies**: express, prisma, @prisma/client, firebase-admin, cors, dotenv, morgan, etc.

---

## 📄 Features

* User signup / login via Firebase → backend automatically provisions user profile
* Create / join / manage groups (with roles: ADMIN, MEMBER)
* Add expenses (group or non-group) — support for EQUAL, EXACT, PERCENT splits
* View expenses per group
* Settlement: record when a user pays another
* Balance computation (global & per-group): who owes whom
* Debt simplification: minimal set of payments to settle all balances (both global & per-group), eliminating circular debts
* Secure APIs: only authenticated users; only group members can view group data; only authorized users (admins, payer/creator) can modify data

---

## 🧰 Getting Started (Local Development)

### Prerequisites

* Node.js 
* Git
* A Firebase project with Authentication enabled
* Firebase service account private key JSON (download from Firebase Console)

### Setup Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/mrpawarGit/FairShare-Backend.git
   cd FairShare-Backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` (or create `.env`) and set environment variables:

   ```text
   PORT=3000

   # PostgreSQL URL (local or hosted)
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME"

   # Firebase credentials (from service account JSON)
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_CLIENT_EMAIL=your-client-email@...iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

4. Run Prisma push to sync schema:

   ```bash
   npx prisma db push
   ```

5. Start server (development):

   ```bash
   npm run dev
   ```

6. Verify health:

   ```
   GET http://localhost:3000/health
   ```

---

## 🔐 Authentication Workflow (Postman / Testing — no frontend required)

You can test APIs using **Postman** (or similar) without building a frontend.

### 1. Create / login a user via Firebase REST API

#### Signup (new user)

```
POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=YOUR_FIREBASE_WEB_API_KEY
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "returnSecureToken": true
}
```

#### Login (existing user)

```
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=YOUR_FIREBASE_WEB_API_KEY
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "returnSecureToken": true
}
```

In response, you’ll get `idToken`. Use this in Authorization header for all backend API calls:

```
Authorization: Bearer <idToken>
```

### 2. Fetch user profile

```
GET /api/users/me
Authorization: Bearer <idToken>
```

The backend will auto-create / fetch the user in the database.

---

## 📘 API Endpoints Overview

Here is a high-level summary. (Use Postman or any HTTP client)

### Auth & User

* `GET /api/users/me` — get current user profile

### Groups

* `POST /api/groups` — create group
* `GET /api/groups` — list groups user belongs to
* `GET /api/groups/:groupId` — get group details
* `GET /api/groups/:groupId/members` — list members
* `POST /api/groups/:groupId/members` — add member (by userId)
* `DELETE /api/groups/:groupId/members/:userId` — remove member

### Expenses

* `POST /api/expenses` — create expense

  * Body example (EQUAL):

    ```json
    {
      "description": "Dinner",
      "amount": 1200,
      "splitType": "EQUAL",
      "groupId": 1,
      "participants": [
        { "userId": 1 },
        { "userId": 2 },
        { "userId": 3 }
      ]
    }
    ```
* `GET /api/expenses/group/:groupId` — list expenses for a group
* `GET /api/expenses/:expenseId` — get single expense
* `PUT /api/expenses/:expenseId` — update expense (creator/payer only)
* `DELETE /api/expenses/:expenseId` — delete expense (creator/payer only)

### Balances & Debt Simplification

* `GET /api/balances/me` — global balances (who owes you, whom you owe)
* `GET /api/balances/group/:groupId` — group-level balances
* `GET /api/balances/simplified` — global debt settlement plan (minimal transactions)
* `GET /api/balances/simplified/group/:groupId` — group-level settlement plan

### Settlements (Payments)

* `POST /api/settlements` — record a payment

  * Body example:

    ```json
    {
      "paidToId": 2,
      "amount": 500,
      "groupId": 1  // optional
    }
    ```
* `GET /api/settlements/group/:groupId` — get settlement history for group

---

## ✅ What’s Implemented & What’s Left

**Implemented:**

* Firebase-based auth + user provisioning
* Groups (create / join / manage)
* Expenses with EQUAL / EXACT / PERCENT splits
* Balances calculation (global & group)
* Debt simplification
* Settlements

**Left / Optional / For Future:**

* Pagination for large result sets
* Soft-delete or archiving expenses/settlements
* Notifications (FCM) when: group changes, expense added, settlement recorded
* Frontend/UI (this is backend only)
* More robust validations (edge cases, currency, rounding, concurrency)

---

