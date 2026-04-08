FROM python:3.9-slim

RUN apt-get update && apt-get install -y default-libmysqlclient-dev build-essential pkg-config && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN python manage.py collectstatic --noinput

CMD ["sh", "-c", "python manage.py migrate --noinput 2>/dev/null || true && gunicorn cardsapp.wsgi:application --bind 0.0.0.0:5000 --workers 3 --timeout 120"]
