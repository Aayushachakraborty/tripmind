# SAFAR

Global AI travel planner built with React, Vite, TypeScript, Vercel functions, Supabase, Gemini, Zod, Tanstack Query, and Zustand.

## Deployment Workflow

This project is connected to Vercel through GitHub. Production deploys are triggered by pushing to the GitHub `master` branch.

Do not run `vercel deploy --prod` for normal releases. Use:

```bash
npm run build
npm test
git push origin master
```

Vercel will build and deploy from the GitHub push automatically.
