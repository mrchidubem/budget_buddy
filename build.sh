#!/usr/bin/env bash
# Build script for Render deployment

# Install dependencies
pip install -r requirements.txt

# Collect static files
python manage.py collectstatic --noinput --settings=budget_buddy.settings_production

# Run migrations
python manage.py migrate --settings=budget_buddy.settings_production
