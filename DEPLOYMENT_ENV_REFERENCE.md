# SkillSphere Local + Online Environment Reference

This project is aligned with the deployment setup from `SkillSphere final design project 1`.

## Local backend `.env`

File: `backend/.env`

- `MYSQL_DB=SkillSphere_Db`
- `MYSQL_USER=root`
- `MYSQL_PASSWORD=`
- `MYSQL_HOST=127.0.0.1`
- `MYSQL_PORT=3306`
- `PORT=5000`
- `NODE_ENV=development`
- `FRONTEND_URL=http://localhost:3000`
- `ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:19006`
- `JWT_SECRET=skillsphere_local_dev_jwt_secret_change_me_before_production`

## Local frontend `.env`

File: `AppAndroidSS/.env`

- `REACT_APP_API_URL=http://localhost:5000`

## Vercel frontend env

Set in Vercel project settings:

- `REACT_APP_API_URL=https://your-railway-backend.up.railway.app`

## Railway backend env

Set in Railway service variables:

- `MYSQL_URL` or Railway MySQL plugin values (`MYSQL_DB`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_HOST`, `MYSQL_PORT`)
- `PORT=5000`
- `NODE_ENV=production`
- `FRONTEND_URL=https://your-vercel-app.vercel.app`
- `ALLOWED_ORIGINS=https://your-vercel-app.vercel.app`
- `JWT_SECRET=<same strong secret used for production>`
- `SUPER_ADMIN_EMAIL=<your admin email>`
- `SUPER_ADMIN_PASSWORD=<your admin password>`

## Optional production integrations

Only fill these if the related features are needed. This project now uses `OpenAI` for AI chat and lecture AI. The old `Groq/Gemini` path has been removed.

- `BREVO_API_KEY`
- `SMTP_FROM_EMAIL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL_LECTURE=gpt-4.1-mini`
- `OPENAI_MODEL_QA=gpt-4.1-mini`
- `OPENAI_MODEL_TUTOR_PLANNER=gpt-4.1-mini`
- `OPENAI_TTS_MODEL=gpt-4o-mini-tts`
- `OPENAI_STT_MODEL=gpt-4o-mini-transcribe`
