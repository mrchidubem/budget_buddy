"""
Production settings for Budget Buddy on Render
"""
import os
from pathlib import Path
from .settings import *

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-8w11s$_ywb=2lb^4db9kz-8%b__)+qtrsgok$)vjobi3lwmb$1')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

# Production hosts - Force override base settings
ALLOWED_HOSTS = [
    'budget-buddy-vibe-coding.onrender.com',  # Your actual Render domain
    '.onrender.com',
    'localhost',
    '127.0.0.1',
]

# Also allow environment variable override
if os.environ.get('ALLOWED_HOSTS'):
    ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS').split(',')

# Security settings for production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
# SECURE_SSL_REDIRECT = True  # Comment out for local testing
# SESSION_COOKIE_SECURE = True  # Comment out for local testing
# CSRF_COOKIE_SECURE = True  # Comment out for local testing

# Static files for production
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [os.path.join(BASE_DIR, 'static')]

# WhiteNoise configuration for static files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Database - Use MySQL on Render, fallback to SQLite for local testing
if os.environ.get('DB_HOST'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': os.environ.get('DB_NAME', 'budget_buddy'),
            'USER': os.environ.get('DB_USER', 'root'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': os.environ.get('DB_HOST', 'localhost'),
            'PORT': os.environ.get('DB_PORT', '3306'),
            'OPTIONS': {
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
                'charset': 'utf8mb4',
            },
        }
    }
else:
    # Fallback to SQLite for local testing
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Supabase Configuration from environment variables
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://hyxhxyvgqhljahfkwiwu.supabase.co')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5eGh4eXZncWhsamFoZmt3aXd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2OTQxMTIsImV4cCI6MjA3MjI3MDExMn0.RN23AzV2SlWuxfbbQq2wkb1sramB_IvnAo1GjWoEmGo')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5eGh4eXZncWhsamFoZmt3aXd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjY5NDExMiwiZXhwIjoyMDcyMjcwMTEyfQ.tiz9alvSp5lXK6yrn0k_kJU6zrM1c52jOc49QOYjIMA')

# Logging for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

# Debug environment variables
print(f"DEBUG: Environment variables loaded")
print(f"DEBUG: ALLOWED_HOSTS = {ALLOWED_HOSTS}")
print(f"DEBUG: DEBUG = {DEBUG}")
print(f"DEBUG: SECRET_KEY = {SECRET_KEY[:20]}...")

# CORS settings for production
CORS_ALLOWED_ORIGINS = [
    "https://budget-buddy-vibe-coding.onrender.com",  # Your actual domain
    "https://hyxhxyvgqhljahfkwiwu.supabase.co",
]

# Allow credentials
CORS_ALLOW_CREDENTIALS = True

# Allow specific headers
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# HTTPS settings (comment out for local testing)
# SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
