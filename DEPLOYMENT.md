# 🚀 Budget Buddy - Rock.app Deployment Guide

## 📋 Prerequisites
- GitHub account
- Rock.app account
- Your Django app working locally

## 🔧 Step 1: Prepare Your Code
1. **Install new dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Test locally with production settings:**
   ```bash
   python manage.py check --settings=budget_buddy.settings_production
   ```

## 🚀 Step 2: Deploy to Rock.app

### 2.1 Create Rock.app Account
- Go to [rock.app](https://rock.app)
- Sign up with GitHub

### 2.2 Connect Your Repository
- Click "New App"
- Connect your GitHub repository
- Select the `budget_buddy` repository

### 2.3 Configure Environment Variables
Set these in Rock.app dashboard:

**Django Settings:**
```
DEBUG=False
SECRET_KEY=your-random-secret-key-here
ALLOWED_HOSTS=your-app-name.rock.app
```

**Database Settings (Rock.app provides these):**
```
DB_NAME=budget_buddy
DB_USER=postgres
DB_PASSWORD=auto-generated
DB_HOST=auto-generated
DB_PORT=5432
```

**Supabase Settings:**
```
SUPABASE_URL=https://hyxhxyvgqhljahfkwiwu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5eGh4eXZncWhsamFoZmt3aXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2OTQxMTIsImV4cCI6MjA3MjI3MDExMn0.RN23AzV2SlWuxfbbQq2wkb1sramB_IvnAo1GjWoEmGo
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2.4 Build Settings
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn budget_buddy.wsgi:application --bind 0.0.0.0:$PORT`
- **Python Version:** 3.11.0

### 2.5 Deploy
- Click "Deploy"
- Wait for build to complete
- Your app will be live at `https://your-app-name.rock.app`

## 🔍 Step 3: Verify Deployment
1. **Check your app URL**
2. **Test budget calculation**
3. **Test saving to Supabase**
4. **Check logs for any errors**

## 🐛 Troubleshooting
- **Build fails:** Check requirements.txt and Python version
- **App won't start:** Check environment variables
- **Database errors:** Verify database credentials
- **Static files not loading:** Check STATIC_ROOT configuration

## 📞 Support
- Rock.app docs: [docs.rock.app](https://docs.rock.app)
- Django deployment: [docs.djangoproject.com](https://docs.djangoproject.com)

## 🎉 Success!
Your Budget Buddy app is now live on the internet! 🌐
