# Vercel Deployment Checklist ✅

## Pre-Deployment Checklist

- [ ] **Repository pushed to GitHub/GitLab/Bitbucket**
- [ ] **vercel.json file created and configured**
- [ ] **package.json scripts updated with vercel-build**
- [ ] **API configuration updated for production**
- [ ] **MongoDB Atlas cluster setup (if using MongoDB)**
- [ ] **Environment variables identified**

## Vercel Setup Checklist

- [ ] **Vercel account created**
- [ ] **Project imported from repository**
- [ ] **Build settings configured:**
  - [ ] Framework Preset: "Other" 
  - [ ] Build Command: `npm run vercel-build`
  - [ ] Output Directory: `client/build`
  - [ ] Install Command: `npm install`

## Environment Variables Setup

Add these to Vercel Dashboard → Project → Settings → Environment Variables:

- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI=your_mongodb_connection_string`
- [ ] `PORT=5000`
- [ ] Other custom environment variables from your .env files

## Post-Deployment Testing

- [ ] **Frontend loads correctly**
- [ ] **API endpoints respond**
  - [ ] GET /api/health
  - [ ] GET /api/items
  - [ ] POST /api/items
  - [ ] PUT /api/items/:id
  - [ ] DELETE /api/items/:id
- [ ] **Database connection works**
- [ ] **All features working as expected**
- [ ] **Environment variables accessible in production**

## MongoDB Atlas Configuration (if applicable)

- [ ] **Cluster created**
- [ ] **Database user created**
- [ ] **Network access configured (0.0.0.0/0 for all IPs)**
- [ ] **Connection string obtained**
- [ ] **Connection string added to Vercel environment variables**

## Custom Domain (Optional)

- [ ] **Domain purchased/available**
- [ ] **Domain added in Vercel dashboard**
- [ ] **DNS records configured**
- [ ] **SSL certificate automatically provisioned**

## Final Checks

- [ ] **Application accessible via production URL**
- [ ] **All functionality tested in production environment**
- [ ] **Performance acceptable**
- [ ] **Error logging/monitoring setup (optional)**

## Common Commands for CLI Deployment

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]
```

## Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas](https://cloud.mongodb.com)
- [GitHub Repository](https://github.com)

---

**Note**: Bu checklist'i deploy process'i sırasında takip ederek hiçbir adımı kaçırmadığınızdan emin olun.
