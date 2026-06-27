# Certificados SSL

Este directorio se monta en el container de nginx en `/etc/nginx/ssl`. nginx.conf
espera encontrar aquí:

- `fullchain.pem`
- `privkey.pem`

## Generarlos con Let's Encrypt (Certbot)

```bash
docker run --rm -p 80:80 \
  -v $(pwd)/nginx/ssl:/etc/letsencrypt/live/tu-dominio.com \
  -v $(pwd)/certbot-webroot:/var/www/certbot \
  certbot/certbot certonly --standalone -d tu-dominio.com

# Copia/symlink fullchain.pem y privkey.pem generados por certbot a este directorio.
```

## O con un certificado propio (autofirmado, solo para pruebas)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/CN=localhost"
```

Renueva antes de que expire (Let's Encrypt: cada 90 días) y reinicia el
container de nginx (`docker compose restart nginx`) para que tome los
certificados nuevos.
