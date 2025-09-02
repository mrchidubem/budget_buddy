#!/usr/bin/env bash
# Build script for Render deployment

# Install dependencies
pip install -r requirements.txt

# Collect static files
# Create and apply migrations, then collectstatic
python manage.py makemigrations --noinput --settings=budget_buddy.settings_production
python manage.py migrate --settings=budget_buddy.settings_production
python manage.py collectstatic --noinput --settings=budget_buddy.settings_production

