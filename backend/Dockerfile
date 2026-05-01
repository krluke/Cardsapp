FROM python:3.9-slim

RUN apt-get update && apt-get install -y default-libmysqlclient-dev build-essential pkg-config curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Build-time static collection needs minimal settings; do not require production secrets here.
RUN RUNNING_IN_DOCKER=1 SECRET_KEY="django-insecure-build-time-key" JWT_SECRET_KEY="django-insecure-build-time-key" ALLOWED_HOSTS="localhost,backend,frontend" python manage.py collectstatic --noinput

CMD ["sh", "-c", "python manage.py migrate --noinput 2>/dev/null || true && python manage.py collectstatic --noinput && gunicorn cardsapp.wsgi:application --bind 0.0.0.0:5000 --workers 3 --timeout 120"]
