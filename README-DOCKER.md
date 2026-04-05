# DevSecOps Process Tracker

Aplicación web para gestión y seguimiento de procesos DevSecOps con soporte para evidencias, dependencias entre tareas, links dinámicos y exportación de resultados.

**Autor:** Harold Adrian  
**Repositorio:** https://github.com/habolanos/devsecops-process-tracker

---

## 🎯 Descripción

Esta aplicación permite a equipos DevSecOps gestionar procesos de seguridad de forma estructurada, incluyendo:

- **Templates de procesos** - Plantillas YAML predefinidas para procesos comunes
- **Gestión de dependencias** - Bloqueo/desbloqueo de tareas basado en prerequisitos
- **Evidencias** - Upload a S3 o almacenamiento local con Base64
- **Variables dinámicas** - Auto-fill desde configuración DevOps
- **Exportación** - JSON y documentos Word con resultados

---

## 🚀 Stack Tecnológico

| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| **Next.js** | 15.5.14 | Framework React con App Router |
| **TypeScript** | 5.2.2 | Tipado estático |
| **Tailwind CSS** | 3.3.3 + shadcn/ui | Estilos y componentes UI |
| **Zustand** | 5.0.12 | Estado global con persistencia localStorage |
| **Vitest** | 4.1.2 | Tests unitarios |
| **Playwright** | 1.40.0 | Tests E2E |

---

## 📦 Docker Usage

### Pull y run (pre-built image)

```bash
# Pull desde Docker Hub
docker pull habolanos/devsecops-process-tracker:latest

# Run con puerto 3000
docker run -d -p 3000:3000 --name devsecops-tracker habolanos/devsecops-process-tracker:latest
```

### Build from source

```bash
# Clonar repositorio
git clone https://github.com/habolanos/devsecops-process-tracker.git
cd devsecops-process-tracker

# Build imagen local
docker build -t devsecops-tracker:local .

# Run
docker run -d -p 3000:3000 --name devsecops-tracker devsecops-tracker:local
```

### docker-compose

```yaml
version: '3.8'
services:
  app:
    image: habolanos/devsecops-process-tracker:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## 📄 Licencia

GNU General Public License v3.0
