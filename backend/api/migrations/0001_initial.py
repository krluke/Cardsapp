# Generated migration for adding SRS fields to Card model
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('email', models.CharField(max_length=255, primary_key=True, serialize=False)),
                ('username', models.CharField(max_length=255)),
                ('password', models.CharField(max_length=255)),
            ],
            options={
                'db_table': 'users',
            },
        ),
        migrations.CreateModel(
            name='VerificationCode',
            fields=[
                ('email', models.CharField(max_length=255, primary_key=True, serialize=False)),
                ('code', models.CharField(max_length=255)),
            ],
            options={
                'db_table': 'verification_codes',
            },
        ),
        migrations.CreateModel(
            name='Folder',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('user_email', models.CharField(max_length=255)),
                ('title', models.CharField(max_length=255)),
                ('visibility', models.CharField(max_length=50)),
                ('likes', models.IntegerField(default=0)),
            ],
            options={
                'db_table': 'folders',
            },
        ),
        migrations.CreateModel(
            name='Card',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('order_index', models.IntegerField()),
                ('front_content', models.TextField()),
                ('back_content', models.TextField()),
                ('front_bg', models.CharField(default='', max_length=50)),
                ('back_bg', models.CharField(default='', max_length=50)),
                ('srs_interval', models.IntegerField(default=0)),
                ('srs_ease', models.FloatField(default=2.5)),
                ('srs_next_review', models.DateTimeField(blank=True, null=True)),
                ('folder', models.ForeignKey(on_delete=models.deletion.CASCADE, db_column='folder_id', to='api.folder')),
            ],
            options={
                'db_table': 'cards',
                'ordering': ['order_index'],
            },
        ),
        migrations.CreateModel(
            name='FolderLike',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('user_email', models.CharField(max_length=255)),
                ('folder', models.ForeignKey(on_delete=models.deletion.CASCADE, db_column='folder_id', to='api.folder')),
            ],
            options={
                'db_table': 'folder_likes',
                'unique_together': {('user_email', 'folder_id')},
            },
        ),
        migrations.CreateModel(
            name='FolderFavorite',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('user_email', models.CharField(max_length=255)),
                ('folder', models.ForeignKey(on_delete=models.deletion.CASCADE, db_column='folder_id', to='api.folder')),
            ],
            options={
                'db_table': 'folder_favorites',
                'unique_together': {('user_email', 'folder_id')},
            },
        ),
    ]