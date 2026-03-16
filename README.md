<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create `.env.local` from `.env.example`
3. Set these environment variables with your own values:
   `VITE_SUPABASE_URL`
   `VITE_SUPABASE_ANON_KEY`
   `SUPABASE_SERVICE_ROLE_KEY`
   `GEMINI_API_KEY`
4. Keep `.env.local` out of git. Only `.env.example` should be committed.
5. For Netlify deploys, add the same variables in Site configuration -> Environment variables.
6. Run the app:
   `npm run dev`

## Deployment Notes

- `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` must stay server-side only.
- `VITE_SUPABASE_ANON_KEY` is a public client key, but it still should not be hardcoded in the repo.
- If a real secret was ever committed before, rotate it in Gemini or Supabase before pushing again.
