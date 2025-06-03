import os
import django
from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth.models import User

# from .models import Task  # Removed because Task is defined above
from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend

# from .models import Task  # Not needed in single-file setup; Task is defined above
# UserSerializer and TaskSerializer are defined above, so no import is needed here
from rest_framework_simplejwt.views import TokenObtainPairView
from django.urls import path

# from .views import RegisterView, TaskListCreateView, TaskDetailView  # Not needed; views are defined above
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.urls import path, include

# main.py

# This is a starter Django REST API for user registration, login (with JWT), and task CRUD.
# Install dependencies:
# pip install django djangorestframework djangorestframework-simplejwt


# Minimal Django setup for a single-file example
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
settings.configure(
    DEBUG=True,
    SECRET_KEY="your-secret-key",
    ROOT_URLCONF=__name__,
    INSTALLED_APPS=[
        "django.contrib.auth",
        "django.contrib.contenttypes",
        "rest_framework",
        "rest_framework_simplejwt",
        "django.contrib.sessions",
        "django.contrib.messages",
        "django.contrib.admin",
        "tasks",  # Our app
    ],
    MIDDLEWARE=[
        "django.middleware.common.CommonMiddleware",
        "django.middleware.csrf.CsrfViewMiddleware",
        "django.contrib.sessions.middleware.SessionMiddleware",
        "django.contrib.auth.middleware.AuthenticationMiddleware",
    ],
    DATABASES={
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": os.path.join(BASE_DIR, "db.sqlite3"),
        }
    },
    REST_FRAMEWORK={
        "DEFAULT_AUTHENTICATION_CLASSES": (
            "rest_framework_simplejwt.authentication.JWTAuthentication",
        ),
        "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
        "DEFAULT_FILTER_BACKENDS": [
            "django_filters.rest_framework.DjangoFilterBackend",
        ],
    },
)

django.setup()

# tasks/models.py


class Task(models.Model):
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in-progress", "In Progress"),
        ("completed", "Completed"),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


# tasks/serializers.py


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "password")

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"], password=validated_data["password"]
        )
        return user


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = "__all__"
        read_only_fields = ("user",)


# tasks/views.py


class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["priority", "status"]
    ordering_fields = ["created_at", "priority"]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user)


# tasks/urls.py

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("tasks/", TaskListCreateView.as_view(), name="task-list-create"),
    path("tasks/<int:pk>/", TaskDetailView.as_view(), name="task-detail"),
]

# main urls.py

urlpatterns = [
    path("api/", include("tasks.urls")),
]

# To run migrations and start the server:
# python manage.py makemigrations tasks
# python manage.py migrate
# python manage.py runserver

# Directory structure:
# main.py
# tasks/
#   __init__.py
#   models.py
#   serializers.py
#   views.py
#   urls.py

# This is a minimal example. For a real project, use Django's project/app structure.
