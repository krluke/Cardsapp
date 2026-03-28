FROM python:3.9-slim

# MySQLへの接続に必要なパッケージをインストール
RUN apt-get update && apt-get install -y default-libmysqlclient-dev build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# backend/app.py を実行
CMD ["python", "app.py"]