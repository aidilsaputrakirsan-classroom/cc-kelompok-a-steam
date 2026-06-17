FROM python:3.12-slim

# Membuat non-root user demi keamanan kontainer
RUN addgroup --system appgroup && adduser --system --group appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Mengubah ownership direktori ke appuser
RUN chown -R appuser:appgroup /app

# Berjalan sebagai non-root user
USER appuser

EXPOSE 8002

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
