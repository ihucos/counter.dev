from django.db import models

from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    prefs = models.JSONField(default=dict)
