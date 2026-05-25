# What even is this?
- This is a mockup of Sterling bank of asia's Avance salary loan form, digitized and streamlined for our final project in information management

---

## Setup Guide for Windows
 
---

## Prerequisites
 
Before starting, make sure you have these installed:
 
| Tool | Download | Purpose |
|---|---|---|
| **Bun** | https://bun.sh | JavaScript runtime & package manager |
| **MySQL 9.7** | https://dev.mysql.com/downloads/installer | Database |
| **MySQL Workbench** | (included with MySQL installer) | Optional GUI |
| **Node.js** | https://nodejs.org | Required by SvelteKit tooling |
 
To verify everything is installed, open a terminal and run:
```powershell
bun --version
mysql --version
node --version
```
 
---
 
## Project Structure
 
```
Sterling Bank of Asia Avance/
├── backend/
│   ├── index.ts          Express API server
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env              Database credentials (edit this)
│   └── Schemas/
│       ├── Loan_Schema.sql         Main database schema
│       └── add_users_table.sql     Users & login accounts
│
└── frontend/
    ├── package.json
    ├── svelte.config.js
    ├── vite.config.ts
    ├── static/
    │   └── logo1.png     Bank logo
    └── src/
        ├── app.css       Global styles
        ├── app.html      HTML entry point
        ├── lib/
        │   ├── api.ts    API helper functions
        │   └── auth.ts   Authentication store
        └── routes/
            ├── +layout.svelte              Sidebar layout
            ├── +page.svelte                Dashboard (admin only)
            ├── login/
            │   └── +page.svelte            Login page
            ├── my-application/
            │   └── +page.svelte            User's own application
            └── applications/
                ├── +page.svelte            All applications (admin)
                ├── new/
                │   └── +page.svelte        New application form
                └── [id]/
                    ├── +page.svelte        Application detail view
                    └── edit/
                        └── +page.svelte    Edit application
```
 
---
 
## Step 1 — MySQL Setup
 
### 1.1 Start MySQL
Open **Services** (Win+R → type `services.msc`), find **MySQL97**, right-click → **Start**.
 
### 1.2 Navigate to MySQL bin folder
```powershell
cd "C:\Program Files\MySQL\MySQL Server 9.7\bin"
```
 
### 1.3 Create the database
```cmd
mysql -u root -p -P 3000 -e "CREATE DATABASE IF NOT EXISTS LoanDB;"
```
Enter your MySQL root password when prompted.
 
### 1.4 Import the main schema
```cmd
mysql -u root -p -P 3000 < "C:\Users\juliu\Downloads\Sterling Bank of Asia Avance\backend\Schemas\Loan_Schema.sql"
```
 
### 1.5 Import the users table
```cmd
mysql -u root -p -P 3000 < "C:\Users\juliu\Downloads\Sterling Bank of Asia Avance\backend\Schemas\add_users_table.sql"
```
 
### 1.6 Verify the data loaded
```cmd
mysql -u root -p -P 3000 -e "USE LoanDB; SHOW TABLES;"
mysql -u root -p -P 3000 -e "USE LoanDB; SELECT * FROM Users;"
```
 
You should see 5 tables and 4 user accounts.
 
---
 
## Step 2 — Backend Setup
 
### 2.1 Install dependencies
```powershell
cd "C:\Users\juliu\Downloads\Sterling Bank of Asia Avance\backend"
bun install
```
 
### 2.2 Configure environment variables
Open `backend/.env` and fill in your credentials:
```
DB_HOST=localhost
DB_PORT=3000
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=LoanDB
PORT=3001
```
 
> **Note:** MySQL runs on port **3000**, the backend API runs on port **3001**. These must be different.
 
### 2.3 Start the backend
```powershell
bun run dev
```
 
You should see:
```
Backend running on http://localhost:3001
```
 
### 2.4 Verify it works
Open these URLs in your browser:
- http://localhost:3001/api/health → should return `{"ok":true}`
- http://localhost:3001/api/applications → should return the 3 sample applications
---
 
## Step 3 — Frontend Setup
 
### 3.1 Install dependencies
Open a **new terminal** (keep the backend terminal open):
```powershell
cd "C:\Users\juliu\Downloads\Sterling Bank of Asia Avance\frontend"
bun install
```
 
### 3.2 Start the frontend
```powershell
bun run dev
```
 
You should see:
```
Local: http://localhost:5173/
```
 
### 3.3 Open in browser
Go to **http://localhost:5173**
 
You should be redirected to the login page.
 
---

## Setup Guide for macOS
 
---
 
## Prerequisites
 
### Install Homebrew (if you don't have it)
Homebrew is macOS's package manager. Open **Terminal** and run:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
 
### Install Bun
```bash
curl -fsSL https://bun.sh/install | bash
```
Then restart your terminal, or run:
```bash
source ~/.zshrc
```
 
### Install MySQL
```bash
brew install mysql
```
 
### Install Node.js (required by SvelteKit tooling)
```bash
brew install node
```
 
### Verify everything installed
```bash
bun --version
mysql --version
node --version
```
 
---
 
## Project Structure
 
```
Sterling Bank of Asia Avance/
├── backend/
│   ├── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                        ← edit this
│   └── Schemas/
│       ├── Loan_Schema.sql
│       └── add_users_table.sql
│
└── frontend/
    ├── package.json
    ├── static/
    │   └── logo1.png
    └── src/
        ├── app.css
        ├── app.html
        ├── lib/
        │   ├── api.ts
        │   └── auth.ts
        └── routes/
            ├── +layout.svelte
            ├── +page.svelte
            ├── login/
            │   └── +page.svelte
            ├── my-application/
            │   └── +page.svelte
            └── applications/
                ├── +page.svelte
                ├── new/
                │   └── +page.svelte
                └── [id]/
                    ├── +page.svelte
                    └── edit/
                        └── +page.svelte
```
 
---
 
## Step 1 — MySQL Setup
 
### 1.1 Start MySQL
```bash
brew services start mysql
```
 
To stop it later:
```bash
brew services stop mysql
```
 
### 1.2 Set a root password
Fresh Homebrew MySQL installs have no root password. Set one:
```bash
mysql_secure_installation
```
Follow the prompts — set a password and remember it.
 
Or if you want to skip the password entirely (easier for development):
```bash
mysql -u root
```
If that gets you in, your password is blank — just press Enter whenever prompted.
 
### 1.3 Check what port MySQL is running on
By default Homebrew MySQL runs on **3306**, not 3000 like on Windows.
```bash
mysql -u root -p -e "SHOW VARIABLES LIKE 'port';"
```
 
### 1.4 Create the database
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS LoanDB;"
```
 
### 1.5 Import the schemas
```bash
# Main schema
mysql -u root -p LoanDB < "/path/to/Sterling Bank of Asia Avance/backend/Schemas/Loan_Schema.sql"
 
# Users table
mysql -u root -p LoanDB < "/path/to/Sterling Bank of Asia Avance/backend/Schemas/add_users_table.sql"
```
 
Replace `/path/to/` with your actual folder path, e.g. `~/Downloads/`.
 
### 1.6 Verify
```bash
mysql -u root -p -e "USE LoanDB; SHOW TABLES;"
mysql -u root -p -e "USE LoanDB; SELECT * FROM Users;"
```
 
---
 
## Step 2 — Backend Setup
 
### 2.1 Install dependencies
```bash
cd "Sterling Bank of Asia Avance/backend"
bun install
```
 
### 2.2 Configure .env
Open `backend/.env` in any text editor and fill it in:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=LoanDB
PORT=3001
```
 
> **Key difference from Windows:** MySQL on Mac via Homebrew runs on port **3306** by default, not 3000.
 
### 2.3 Start the backend
```bash
bun run dev
```
 
You should see:
```
Backend running on http://localhost:3001
```
 
### 2.4 Verify
Open in your browser:
- http://localhost:3001/api/health → `{"ok":true}`
- http://localhost:3001/api/applications → sample data
---
 
## Step 3 — Frontend Setup
 
### 3.1 Install dependencies
Open a **new terminal tab** (Cmd+T):
```bash
cd "Sterling Bank of Asia Avance/frontend"
bun install
```
 
### 3.2 Start the frontend
```bash
bun run dev
```
 
### 3.3 Open in browser
Go to **http://localhost:5173**
 
---
