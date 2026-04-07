# DevSecOps Process Tracker

Aplicación web para gestión y seguimiento de procesos DevSecOps con soporte para evidencias, dependencias entre tareas, links dinámicos y exportación de resultados.

**Autor:** Harold Adrian 
**LinkedIn:** https://www.linkedin.com/in/habolanos
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

El repositorio incluye un archivo `docker-compose.yml` preconfigurado.

**Usar imagen pre-built desde Docker Hub:**
```bash
# Descargar docker-compose.yml
curl -O https://raw.githubusercontent.com/habolanos/devsecops-process-tracker/main/docker-compose.yml

# Modificar para usar imagen pre-built (cambiar 'build' por 'image')
# Luego ejecutar:
docker-compose up -d
```

**Build local desde código fuente:**
```bash
git clone https://github.com/habolanos/devsecops-process-tracker.git
cd devsecops-process-tracker
docker-compose up --build -d
```

**Servicios incluidos:**
- `process-tracker`: Aplicación web en puerto 3000
- Red `app-network` para comunicación entre servicios

## 📄 Licencia

GNU General Public License v3.0
