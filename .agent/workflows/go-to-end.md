---
description: Finalize project with mobile optimization, premium styling, and automated deployment
---

This workflow automates the final delivery stages of a high-end web application, ensuring it "flies" on all devices and is properly deployed.

// turbo-all
1. Build the project to verify production readiness
   ```bash
   npm run build
   ```

2. Perform a final commit with descriptive versioning
   ```bash
   git add . && git commit -m "chore: final performance optimization and mobile adaptive update"
   ```

3. Create a clean production-ready repository if needed and push
   ```bash
   git push origin main
   ```

4. Deploy to Vercel for immediate preview
   ```bash
   npx vercel --prod --yes
   ```

5. Output deployment status and preview URLs
