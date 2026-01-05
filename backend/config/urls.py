"""
URL configuration for CubicleAlly project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),

    # App URLs
    path('api/', include('users.urls')),
    path('api/', include('skills.urls')),
    path('api/', include('progress.urls')),
    path('api/', include('documents.urls')),
]
