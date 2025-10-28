# Environment Variable Troubleshooting Guide

## ✅ FIXES APPLIED

### 1. Fixed Hardcoded URLs
- **src/utils/socket.js**: Changed hardcoded `localhost:3001` to use `process.env.REACT_APP_SOCKET_URL`
- All other files were already using environment variables correctly

### 2. Environment Variable Loading

React environment variables MUST:
1. **Start with `REACT_APP_`** - This is required by Create React App
2. **Be set BEFORE the build** - They are baked into the build at compile time
3. **Exist in `.env.production`** for production builds

---

## 🔧 HOW TO FIX ENVIRONMENT VARIABLE ISSUES

### Problem: Environment Variables Not Loading

#### Checklist:
- [x] ✅ Variables start with `REACT_APP_`
- [x] ✅ `.env.production` file exists in project root
- [x] ✅ File is NOT in `.gitignore` (for local use)
- [x] ✅ No hardcoded URLs in code

### For GitHub Pages Deployment:

#### Option A: Manual Deployment (Current Setup)
```powershell
# Make sure .env.production exists with:
REACT_APP_API_URL=http://ec2-35-154-111-148.ap-south-1.compute.amazonaws.com:3001
REACT_APP_SOCKET_URL=http://ec2-35-154-111-148.ap-south-1.compute.amazonaws.com:3001

# Then deploy
npm run deploy
```

#### Option B: GitHub Actions (Recommended for Teams)

1. **Add GitHub Secrets:**
   - Go to: `https://github.com/RushiK8626/Chat-Messaging-App/settings/secrets/actions`
   - Add secrets:
     - `REACT_APP_API_URL` = `http://ec2-35-154-111-148.ap-south-1.compute.amazonaws.com:3001`
     - `REACT_APP_SOCKET_URL` = `http://ec2-35-154-111-148.ap-south-1.compute.amazonaws.com:3001`

2. **Enable GitHub Pages:**
   - Go to: Settings → Pages
   - Set Source to **GitHub Actions**

3. **Workflow file already exists:** `.github/workflows/deploy.yml`

4. **Push to trigger deployment:**
   ```powershell
   git add .
   git commit -m "Fix environment variables"
   git push
   ```

---

## 🐛 DEBUGGING TIPS

### Check if Environment Variables are Loaded:

Add this temporarily to any component:
```javascript
console.log('API_URL:', process.env.REACT_APP_API_URL);
console.log('SOCKET_URL:', process.env.REACT_APP_SOCKET_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
```

### Verify Build Output:

After building, check if the URLs are in the bundle:
```powershell
# Search for your AWS URL in the build
Select-String -Path "build\static\js\*.js" -Pattern "ec2-35-154-111-148"
```

If you see your AWS URL → ✅ Environment variables loaded correctly
If you see `localhost:3001` → ❌ Environment variables not loaded

### Common Issues:

1. **`.env.production` file missing**
   - Solution: Create it in project root

2. **Variables don't start with `REACT_APP_`**
   - Solution: Rename them (e.g., `API_URL` → `REACT_APP_API_URL`)

3. **Building without environment file**
   - Solution: Ensure `.env.production` exists before `npm run build`

4. **Cached build**
   - Solution: Delete `build` folder and rebuild:
     ```powershell
     Remove-Item -Path build -Recurse -Force
     npm run build
     ```

5. **Browser cache**
   - Solution: Hard refresh (`Ctrl + Shift + R`) or clear cache

---

## 📝 CURRENT CONFIGURATION

### Environment Variables:
```env
REACT_APP_API_URL=http://ec2-35-154-111-148.ap-south-1.compute.amazonaws.com:3001
REACT_APP_SOCKET_URL=http://ec2-35-154-111-148.ap-south-1.compute.amazonaws.com:3001
```

### Files Using Environment Variables:
- ✅ `src/config/api.config.js`
- ✅ `src/utils/socket.js` (FIXED)
- ✅ `src/utils/apiClient.js`
- ✅ `src/pages/Login.js`
- ✅ `src/pages/Register.js`
- ✅ `src/pages/OTPVerification.js`
- ✅ All other pages use fallback to `localhost:3001`

### Deployment Methods:
1. **Manual:** `npm run deploy` (requires local `.env.production`)
2. **Script:** `.\deploy.ps1` (sets env vars before deploying)
3. **GitHub Actions:** Automatic on push (uses GitHub Secrets)

---

## 🚀 NEXT STEPS

1. Deploy the fix:
   ```powershell
   npm run deploy
   ```

2. Wait 2-3 minutes for GitHub Pages to update

3. Hard refresh your browser: `Ctrl + Shift + R`

4. Check browser console for environment variable values

5. If still showing localhost, verify:
   - `.env.production` file exists
   - File contains correct URLs
   - No typos in variable names
   - Build was successful

---

## 📚 RESOURCES

- [Create React App - Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [GitHub Actions - Environment Variables](https://docs.github.com/en/actions/learn-github-actions/variables)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
