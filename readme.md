# Daily Udhari

Daily Udhari is a full-stack financial application designed to make expense tracking, splitting bills, and settling debts with friends and groups incredibly simple and transparent. It features a modern, animated React frontend and a robust Java Spring Boot backend.

---

## 🏗️ Architecture

The project is divided into two main components:
1. **Frontend (`/client`)**: A modern React application built with Vite, TypeScript, Tailwind CSS, and Framer Motion for smooth animations.
2. **Backend (`/server-java`)**: A secure and scalable REST API built with Java, Spring Boot, Spring Data JPA, and PostgreSQL.

---

## ✨ Key Features

- **Authentication System**: Secure user registration and login using either Email or a 10-digit Mobile Number, protected by JWT (JSON Web Tokens).
- **Dashboard Overview**: A beautiful financial dashboard summarizing total balances, amounts owed, and amounts you are owed.
- **Friends System**: Search for other registered users and add them as friends to start tracking shared expenses.
- **Group Management**: Create groups (e.g., "Goa Trip", "Roommates"), add friends to them, and track group-specific expenses.
- **Advanced Expense Splitting**: Add expenses with dynamic split methods:
  - **EQUAL**: Split the bill equally among selected participants.
  - **EXACT**: Specify exact currency amounts for each participant.
  - **PERCENTAGE**: Split the bill by specific percentage weights.
- **Two-Step Secure Settlements**: Settle debts using a secure 2-step verification process. The payer initiates the settlement, which generates a random 6-digit PIN. The payee can either approve the transaction directly on their dashboard or share the PIN with the payer to confirm the transfer.
- **Activity Feed**: View a chronologically sorted history of all your expense additions and settlement transactions, separated into distinct tabs.

---

## 📂 Folder Structure

### Frontend (`/client`)
- **`/src/components`**: Reusable UI components.
  - **`/ui`**: Generic components like `Button`, `Input`, `Card`, and `Modal`.
  - **`/features`**: Feature-specific components (e.g., `auth/LoginForm.tsx`, `dashboard/DashboardSummary.tsx`).
  - **`ExpenseForm.tsx`**: The modal for adding complex expenses and splits.
  - **`SettlementModal.tsx`**: The modal handling the 2-step PIN settlement flow.
- **`/src/pages`**: Page-level components corresponding to router views.
  - **`Dashboard/`**: Contains `Overview`, `Activity`, `Friends`, and `GroupDetail` pages.
  - **`LoginPage.tsx`**: The landing page for authentication.
- **`/src/services`**: API and utility services.
  - **`ApiService.ts`**: Axios instance configured with JWT interceptors for authenticated API calls.
- **`/src/layouts`**: Layout wrappers (e.g., `DashboardLayout` containing the Sidebar).

### Backend (`/server-java`)
- **`/src/main/java/com/dailyudhari/server/controller`**: REST API endpoints.
  - `AuthController.java` / `UserController.java`: Handles `/login` and `/register`.
  - `ExpenseController.java`: Manages expense creation and splits.
  - `SettlementController.java`: Manages the initiation, approval, and fetching of settlements.
  - `GroupController.java`: Handles group creation and member management.
  - `FriendController.java`: Handles adding and listing friends.
- **`/src/main/java/com/dailyudhari/server/domain`**: JPA Entities defining the database schema.
  - `User.java`: Core user entity.
  - `Expense.java` & `ExpenseSplit.java`: Expense tracking.
  - `Settlement.java`: Settlement tracking with status and keys.
  - `Group.java`: Group tracking.
- **`/src/main/java/com/dailyudhari/server/repository`**: Spring Data JPA interfaces for database access.
- **`/src/main/java/com/dailyudhari/server/service`**: Core business logic.
  - `SettlementService.java`: Logic for calculating balances, generating 6-digit PINs, and confirming settlements.
  - `ExpenseService.java`: Logic for validating and distributing expense splits.
- **`/src/main/java/com/dailyudhari/server/config`**: Configuration files (e.g., `SecurityConfig.java` for JWT/CORS).

---

## 🗄️ Database Schema (PostgreSQL)

The application uses PostgreSQL with the following core entities:

1. **`users`**: `id`, `name`, `email`, `mobile_number`, `password_hash`
2. **`friendships`**: `id`, `user_id_1`, `user_id_2`, `status`, `created_at`
3. **`groups`**: `id`, `name`, `created_by`, `created_at`
4. **`user_groups`**: Mapping table linking `users` to `groups`
5. **`expenses`**: `id`, `description`, `amount`, `payer_id`, `group_id`, `split_type` (EQUAL, EXACT, PERCENTAGE), `created_at`
6. **`expense_splits`**: `id`, `expense_id`, `user_id`, `amount` (Maps exactly how much each user owes for a specific expense).
7. **`settlements`**: `id`, `payer_id`, `payee_id`, `group_id`, `amount`, `status` (PENDING/CONFIRMED), `settlement_key` (6-digit PIN), `created_at`

---

## 🚀 How to Run the Project Locally

### Prerequisites
- **Node.js** (v18+ recommended)
- **Java JDK** (v22 or compatible)
- **Maven**
- **PostgreSQL** database (Local or Cloud instance like NeonDB)

### 1. Database Setup
Ensure you have a PostgreSQL database running. You do not need to create tables manually; Hibernate/JPA will auto-generate them based on the entities.

### 2. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd server-java
   ```
2. Open `/src/main/resources/application.properties` and update the database credentials:
   ```properties
   spring.datasource.url=jdbc:postgresql://<YOUR_DB_URL>/DailyUdhari
   spring.datasource.username=<YOUR_USERNAME>
   spring.datasource.password=<YOUR_PASSWORD>
   ```
3. Run the Spring Boot application using the Maven wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```
   *The backend will start on `http://localhost:5050`.*

### 3. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd client
   ```
2. Create a `.env` file in the `client` root and configure the API URL:
   ```env
   VITE_API_URL=http://localhost:5050/api
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will be accessible at `http://localhost:5173` (or the port specified in the terminal output).*

---

## 🔒 Security Notes
- Passwords are currently handled via the `password_hash` column.
- JWT tokens are generated upon login/registration and stored in local storage on the frontend.
- Tokens expire after 24 hours. The frontend intercepts 401 Unauthorized responses and auto-logs the user out.