from django.db import migrations


def _dedupe_usernames(apps, schema_editor):
    User = apps.get_model("api", "User")

    # Find duplicates
    seen = {}
    for user in User.objects.all().only("email", "username").order_by("email"):
        username = (user.username or "").strip()
        if not username:
            # Make sure username is non-empty so the unique constraint can be applied.
            username = user.email.split("@")[0] if user.email else "user"
        base = username

        if base not in seen:
            seen[base] = 0
            if user.username != username:
                user.username = username
                user.save(update_fields=["username"])
            continue

        # Duplicate: append suffix until unique across all users
        suffix = seen[base] + 1
        candidate = f"{base}_{suffix}"
        while User.objects.filter(username=candidate).exists():
            suffix += 1
            candidate = f"{base}_{suffix}"

        user.username = candidate
        user.save(update_fields=["username"])
        seen[base] = suffix


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0002_add_tags"),
    ]

    operations = [
        migrations.RunPython(_dedupe_usernames, reverse_code=migrations.RunPython.noop),
        migrations.RunSQL(
            sql="ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);",
            reverse_sql="ALTER TABLE users DROP INDEX users_username_unique;",
        ),
    ]

