# ğŸš€ Render.com Deployment Checklist

## Pre-Deploy Setup
- [ ] MongoDB Atlas cluster created
- [ ] Database user created with read/write permissions
- [ ] IP whitelist set to 0.0.0.0/0 (allow all)
- [ ] Connection string copied
- [ ] GitHub repository created and set to public
- [ ] Code pushed to GitHub

## Backend Deploy (Web Service)
- [ ] Render account created
- [ ] Web Service created with settings:
  - Name: fund-tracker-backend
  - Environment: Node
  - Region: Frankfurt (EU Central)
  - Branch: main
  - Root Directory: server
  - Build Command: npm install
  - Start Command: npm start
- [ ] Environment variables added:
  - MONGODB_URI: [Your MongoDB Atlas connection string]
  - NODE_ENV: production
  - PORT: 5000
- [ ] Service deployed successfully
- [ ] Backend URL noted: https://fund-tracker-backend.onrender.com

## Frontend Deploy (Static Site)
- [ ] Static Site created with settings:
  - Name: fund-tracker-frontend
  - Branch: main
  - Root Directory: client
  - Build Command: npm install && npm run build
  - Publish Directory: build
- [ ] Environment variables added:
  - REACT_APP_API_URL: [Your backend URL]
- [ ] Site deployed successfully
- [ ] Frontend URL noted: https://fund-tracker-frontend.onrender.com

## Post-Deploy Testing
- [ ] Backend health check: GET /api/health
- [ ] Frontend loads successfully
- [ ] Admin login works (admin/admin123)
- [ ] Fund operations work (add/edit/delete)
- [ ] Transaction history works
- [ ] Progress bar displays correctly
- [ ] Mobile responsive design works

## URLs for Reference
Backend: https://fund-tracker-backend.onrender.com
Frontend: https://fund-tracker-frontend.onrender.com
Database: MongoDB Atlas

## Common Issues
1. Build failures: Check Node.js version in engines
2. CORS errors: Update CORS origins in server.js
3. API connection: Verify environment variables
4. Database connection: Check MongoDB Atlas settings
