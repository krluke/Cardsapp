from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0003_unique_username"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="clerk_user_id",
            field=models.CharField(max_length=255, null=True, blank=True, unique=True),
        ),
        migrations.AlterField(
            model_name="user",
            name="password",
            field=models.CharField(max_length=255, null=True, blank=True),
        ),
        migrations.DeleteModel(
            name="VerificationCode",
        ),
    ]
