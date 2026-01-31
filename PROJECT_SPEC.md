# PROJECT_SPEC.md: Job Match AI (Full Stack Implementation)

## 1. Project Overview
A web application where users can sign up, upload a CV, and receive AI-curated job matches. The system uses a Next.js frontend, a PostgreSQL (Neon.tech) database, and an n8n automation workflow to scrape and analyze jobs.

**Goal:** Create a seamless flow from User Input -> Webhook -> Scraping (Apify) -> AI Analysis (Ollama) -> Database -> User Dashboard/Email.

---

## 2. Tech Stack & Credentials
* **Frontend:** Next.js (Pages Router: `frontend/pages`), Tailwind CSS.
* **Deployment:** Vercel (Critical: Must pass `npm run build` without type errors).
* **Database:** PostgreSQL (Neon.tech).
* **Automation:** n8n (Self-hosted with Local Ollama access).
* **Scraper:** Apify (LinkedIn/Indeed actors).
* **AI:** Ollama (Local Llama 3/Mistral model).

---

## 3. Database Schema (PostgreSQL/Neon)
**Action:** Execute this SQL in the Neon.tech SQL Editor to set up the required structure.

```sql
-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    cv_url TEXT, -- Link to stored CV file
    cv_uploaded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Search Requests Table (Tracks the status of a user's search)
CREATE TABLE IF NOT EXISTS searches (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    job_title VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job Matches Table (Stores the AI analysis results)
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    search_id INT REFERENCES searches(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    job_title VARCHAR(255),
    company_name VARCHAR(255),
    location VARCHAR(255),
    job_url TEXT,
    match_score INT, -- 0-100
    reason_qualified TEXT, -- Why it's a match
    reason_disqualified TEXT, -- Why it failed
    is_qualified BOOLEAN DEFAULT FALSE, -- True if score >= 70
    is_hidden BOOLEAN DEFAULT FALSE, -- User can hide this result
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);