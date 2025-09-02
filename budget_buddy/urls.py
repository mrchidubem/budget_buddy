"""
URL configuration for budget_buddy project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from budget import views as budget_views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # Landing should be login page
    path('', budget_views.login_view, name='landing_login'),
    # Dedicated dashboard path (login required inside view)
    path('dashboard/', budget_views.dashboard_page, name='dashboard_page'),
    # Convenience routes
    path('signup/', budget_views.signup_view, name='signup_page'),
    path('login/', budget_views.login_view, name='login_page'),
    path('budget/', include('budget.urls')),
]

# Add static files serving for development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])