"""
Production settings for Budget Buddy on Render
"""
import os
from pathlib import Path
from .settings import *

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Production hosts
ALLOWED_HOSTS = [
    'budget-buddy-vibe-coding.onrender.com',  # Your actual Render domain
    '.onrender.com',
    'localhost',
    '127.0.0.1',
]

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
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

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

# CORS settings for production
CORS_ALLOWED_ORIGINS = [
    "https://budget-buddy-vibe-coding.onrender.com",  # Your actual domain
    "https://*.onrender.com",
]

# HTTPS settings (comment out for local testing)
# SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
