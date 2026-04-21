# DevSecOps Process Tracker — Docker

Imagen oficial de **DevSecOps Process Tracker**, una plataforma web para ejecutar, auditar y exportar procesos DevSecOps definidos en YAML (evidencias, dependencias, variables, links dinámicos, BPMN 2.0 y reportes Excel/Word/JSON).

- **Repositorio:** <https://github.com/habolanos/devsecops-process-tracker>
- **Documentación completa:** <https://github.com/habolanos/devsecops-process-tracker/blob/main/README.md>
- **Autor:** Harold Adrian — <https://www.linkedin.com/in/habolanos>
- **Licencia:** GPL-3.0

---

## Características

- Ejecución guiada de procesos YAML con **7 tipos de tareas** (standard, check, multicheck, dynamic-list, detail-list, form, export-excel).
- **Export Excel declarativo** (`process.export`) sin escribir código TypeScript.
- **Visor BPMN 2.0 interactivo** con navegación por click.
- **Evidencias** (texto, imagen, clipboard) con S3/Azure Blob o modo local Base64.
- **Bandeja multi-proceso** con snapshots y persistencia comprimida.
- **i18n** ES/EN y tema claro/oscuro.

---

## Quick start

```bash
docker run -d -p 3000:3000 --name tracker \
  habolanos/devsecops-process-tracker:latest
```

Abra <http://localhost:3000>. La aplicación funciona sin credenciales: persiste estado y evidencias en `localStorage` (modo local Base64).

---

## Opciones de despliegue

### 1) Con persistencia en volumen

```bash
docker volume create tracker-data
docker run -d -p 3000:3000 --name tracker \
  -v tracker-data:/app/data \
  habolanos/devsecops-process-tracker:latest
```

### 2) Con almacenamiento S3 (evidencias en la nube)

```bash
docker run -d -p 3000:3000 --name tracker \
  -e AWS_BUCKET_NAME=mi-bucket \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=... \
  -e AWS_SECRET_ACCESS_KEY=... \
  habolanos/devsecops-process-tracker:latest
```

### 3) Con `docker compose`

```yaml
services:
  tracker:
    image: habolanos/devsecops-process-tracker:latest
    ports:
      - "3000:3000"
    environment:
      AWS_BUCKET_NAME: ${AWS_BUCKET_NAME:-}
      AWS_REGION: ${AWS_REGION:-us-east-1}
    restart: unless-stopped
```

```bash
docker compose up -d
```

---

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `AWS_BUCKET_NAME` | opcional | Bucket S3 para evidencias. Sin esta variable opera en modo local Base64. |
| `AWS_REGION` | opcional | Región AWS (default `us-east-1`). |
| `AWS_ACCESS_KEY_ID` | opcional | Credencial AWS. |
| `AWS_SECRET_ACCESS_KEY` | opcional | Credencial AWS. |
| `AWS_FOLDER_PREFIX` | opcional | Prefijo de carpeta en el bucket. |
| `NEXTAUTH_SECRET` | opcional | Secreto para NextAuth (si se habilita autenticación). |
| `NEXTAUTH_URL` | opcional | URL pública para NextAuth. |

---

## Tags

- `latest` — última release estable.
- `X.Y.Z` — versión semántica específica (ej. `2.0.4`).

Imágenes multi-arquitectura: `linux/amd64` y `linux/arm64`.

---

## Verificación de firma (Cosign)

Todas las imágenes se firman con [Cosign/Sigstore](https://www.sigstore.dev/) durante el pipeline de release.

```bash
cosign verify habolanos/devsecops-process-tracker:latest \
  --certificate-identity-regexp="https://github.com/habolanos/devsecops-process-tracker/*" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com"
```

Además se publica **SBOM** en formatos SPDX y CycloneDX, y **SLSA Level 3 attestations** vía GitHub Attestations.

---

## Stack interno

| Tecnología | Versión |
|------------|---------|
| Next.js | 16.2 (standalone) |
| React | 18.3 |
| TypeScript | 5.2 |
| Node.js runtime | 20 LTS (Alpine 3.21) |
| Zustand | 5.0 |
| Tailwind + shadcn/ui | 3.3 |
| bpmn-js | 18.14 |
| ExcelJS / docx | 4.4 / 9.6 |

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `port 3000 already in use` | Mapee otro puerto: `-p 3001:3000`. |
| Datos no persisten entre reinicios | Monte un volumen: `-v tracker-data:/app/data`. |
| `permission denied` (Linux) | Ejecute con `sudo` o añada el usuario al grupo `docker`. |
| Contenedor no arranca | Revise logs: `docker logs tracker`. |
| Evidencias no suben a S3 | Verifique las cuatro variables `AWS_*` y permisos del bucket (`s3:PutObject`, `s3:GetObject`). |

---

## Licencia

**GNU General Public License v3.0** — Software libre para uso educativo y comercial.
