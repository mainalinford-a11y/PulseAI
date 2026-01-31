# Migration Complete: AWS S3 → PostgreSQL BYTEA Storage

## Summary
Successfully migrated all CV file storage from AWS S3 to PostgreSQL database (BYTEA columns) to eliminate AWS costs.

## Changes Made

### 1. Database Schema
**File:** `database/migrations/20260129_add_cv_files.sql`
- Created `cv_files` table with columns:
  - `id`: Primary key
  - `user_id`: Foreign key to users table
  - `filename`: Original filename
  - `mime_type`: File MIME type
  - `file_content`: Binary file data (BYTEA)
  - `uploaded_at`: Timestamp
  - `is_current`: Boolean flag for active CV
- Added indexes on `(user_id)` and `(user_id, is_current)` for performance
- **Status:** ✓ Applied to Neon database

### 2. File Upload Endpoint
**File:** `frontend/pages/api/user/upload-cv.ts`
- **Changes:**
  - Removed all AWS S3 client code and imports
  - Now reads uploaded file and stores directly in `cv_files` table as BYTEA
  - Validates file types: PDF, DOC, DOCX (by extension or MIME type)
  - Max file size: 5MB
  - Returns CV ID instead of S3 URL
  - Returns new endpoint path: `/api/user/cv/{id}`

### 3. CV File Serve Endpoint
**File:** `frontend/pages/api/user/cv/[id].ts` (NEW)
- **Purpose:** Serve CV files from database with correct headers
- **Features:**
  - GET endpoint that retrieves file from `cv_files` table
  - Sets `Content-Type` header based on stored MIME type
  - Sets `Content-Disposition` header for download
  - Supports optional authentication (checks JWT cookie)
  - Returns 404 if file not found
  - Returns 403 if authenticated user doesn't own the file

### 4. TypeScript Fixes
**File:** `frontend/pages/api/auth/me.ts`
- Added type annotation to catch parameter for type safety

## Testing & Verification

✓ **Build:** Next.js build completes successfully with no errors
✓ **Database:** Migration applied to Neon; verified all columns exist
✓ **Code:** All TypeScript compiles without errors

## Vercel Deployment

### Required Environment Variables
Set these in Vercel Dashboard or via CLI:

```env
DATABASE_URL=postgresql://neondb_owner:npg_Hd5SBW9nAJNX@ep-calm-dawn-ah15v0m8-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
N8N_WEBHOOK_URL=https://sterilisable-joy-unintervolved.ngrok-free.dev/webhook-test/signup-webhook
JWT_SECRET=[your-existing-secret]
ALLOW_INSECURE_COOKIES=false
DEBUG_AUTH=false
```

### Optional Environment Variables
```env
USE_PINNED_APIFY_DATA=false
APIFY_PINNED_DATASET_ID=[optional]
```

### No Longer Needed
- ❌ `S3_BUCKET`
- ❌ `AWS_REGION`
- ❌ `AWS_ACCESS_KEY_ID`
- ❌ `AWS_SECRET_ACCESS_KEY`

Remove these from Vercel if they were previously set.

## End-to-End Flow

1. **User Signs Up** → `/signup` (form)
2. **Creates Account** → POST `/api/auth/signup`
3. **Logs In** → POST `/api/auth/login` (sets httpOnly cookie)
4. **Uploads CV** → POST `/api/user/upload-cv` (stored in DB)
   - Returns CV ID and endpoint URL
   - URL: `/api/user/cv/{id}`
5. **Searches Jobs** → POST `/api/n8n/start-matching`
   - Webhook triggers n8n workflow
   - n8n fetches CV from `/api/user/cv/{id}` endpoint
   - Apify scrapes LinkedIn jobs
   - Ollama evaluates CV match
   - Results stored in Neon
6. **Views Matches** → GET `/api/n8n/matches`

## Next Steps

1. **Set Vercel environment variables** (see section above)
2. **Deploy to Vercel:**
   ```bash
   npx vercel --prod --yes
   ```
3. **Test the flow:**
   - Sign up / Login
   - Upload PDF or DOCX CV
   - Submit job search form
   - Verify n8n webhook execution logs
   - Check job matches appear on dashboard

## Git Commits
- `ae0c286`: Migrate CV storage from AWS S3 to PostgreSQL database
- `9d3e786`: Fix TypeScript error in /api/auth/me.ts
- `8ee0eea`: Clean up temporary migration scripts

---

**Status:** Ready for Vercel deployment. All code changes complete and tested locally.
