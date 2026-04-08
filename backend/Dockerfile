FROM python:3.9-slim

# MySQL client build deps
RUN apt-get update && apt-get install -y default-libmysqlclient-dev build-essential pkg-config && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Collect static files with hashed filenames
RUN python manage.py collectstatic --noinput

# Run migrations then start gunicorn
CMD ["sh", "-c", "python manage.py migrate --noinput 2>/dev/null || true && gunicorn cardsapp.wsgi:application --bind 0.0.0.0:5000 --workers 3 --timeout 120"]
