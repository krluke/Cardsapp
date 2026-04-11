from django.db import models


class User(models.Model):
    email = models.CharField(max_length=255, primary_key=True)
    username = models.CharField(max_length=255)
    password = models.CharField(max_length=255)

    class Meta:
        db_table = "users"


class VerificationCode(models.Model):
    email = models.CharField(max_length=255, primary_key=True)
    code = models.CharField(max_length=255)

    class Meta:
        db_table = "verification_codes"


class Folder(models.Model):
    id = models.AutoField(primary_key=True)
    user_email = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    visibility = models.CharField(max_length=50)
    likes = models.IntegerField(default=0)

    class Meta:
        db_table = "folders"


class Card(models.Model):
    id = models.AutoField(primary_key=True)
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, db_column="folder_id")
    order_index = models.IntegerField()
    front_content = models.TextField()
    back_content = models.TextField()
    front_bg = models.CharField(max_length=50, default="", db_column="front_bg")
    back_bg = models.CharField(max_length=50, default="", db_column="back_bg")
    # SRS (Spaced Repetition System) fields
    srs_interval = models.IntegerField(default=0)  # days until next review
    srs_ease = models.FloatField(default=2.5)      # ease factor
    srs_next_review = models.DateTimeField(null=True, blank=True)  # next review date

    class Meta:
        db_table = "cards"
        ordering = ["order_index"]


class FolderLike(models.Model):
    user_email = models.CharField(max_length=255)
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, db_column="folder_id")

    class Meta:
        db_table = "folder_likes"
        unique_together = ("user_email", "folder_id")


class FolderFavorite(models.Model):
    user_email = models.CharField(max_length=255)
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, db_column="folder_id")

    class Meta:
        db_table = "folder_favorites"
        unique_together = ("user_email", "folder_id")
