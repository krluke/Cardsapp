from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = 'Ensure SRS columns exist in cards table'

    def handle(self, *args, **options):
        self.stdout.write('Checking for SRS columns in cards table...')
        
        with connection.cursor() as c:
            # Check if columns exist
            c.execute("""
                SELECT COUNT(*) as cnt 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'cards' 
                AND COLUMN_NAME = 'srs_interval'
            """)
            has_interval = c.fetchone()[0] > 0
            
            c.execute("""
                SELECT COUNT(*) as cnt 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'cards' 
                AND COLUMN_NAME = 'srs_ease'
            """)
            has_ease = c.fetchone()[0] > 0
            
            c.execute("""
                SELECT COUNT(*) as cnt 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'cards' 
                AND COLUMN_NAME = 'srs_next_review'
            """)
            has_next_review = c.fetchone()[0] > 0

        if not has_interval:
            self.stdout.write('Adding srs_interval column...')
            with connection.cursor() as c:
                c.execute("ALTER TABLE cards ADD COLUMN srs_interval INT DEFAULT 0")
            self.stdout.write(self.style.SUCCESS('Added srs_interval column'))
        else:
            self.stdout.write('srs_interval column already exists')

        if not has_ease:
            self.stdout.write('Adding srs_ease column...')
            with connection.cursor() as c:
                c.execute("ALTER TABLE cards ADD COLUMN srs_ease DECIMAL(3,2) DEFAULT 2.5")
            self.stdout.write(self.style.SUCCESS('Added srs_ease column'))
        else:
            self.stdout.write('srs_ease column already exists')

        if not has_next_review:
            self.stdout.write('Adding srs_next_review column...')
            with connection.cursor() as c:
                c.execute("ALTER TABLE cards ADD COLUMN srs_next_review DATETIME DEFAULT NULL")
            self.stdout.write(self.style.SUCCESS('Added srs_next_review column'))
        else:
            self.stdout.write('srs_next_review column already exists')

        self.stdout.write(self.style.SUCCESS('SRS columns migration complete!'))