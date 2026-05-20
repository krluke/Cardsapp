from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0003_unique_username"),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE users ADD COLUMN clerk_user_id VARCHAR(255) NULL;",
            reverse_sql="ALTER TABLE users DROP COLUMN clerk_user_id;",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE users ADD CONSTRAINT users_clerk_user_id_unique UNIQUE (clerk_user_id);",
            reverse_sql="ALTER TABLE users DROP INDEX users_clerk_user_id_unique;",
        ),
        migrations.RunSQL(
            sql="ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL;",
            reverse_sql="ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL;",
        ),
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS verification_codes;",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
