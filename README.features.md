# 📋 Features — DevSecOps Process Tracker

> Inventario centralizado de todas las features documentadas: estado de implementación,
> versión de entrega, prioridad, esfuerzo estimado y referencia al documento de diseño.

---

## 📊 Estado General

| ✅ Implementado | 🚧 Parcial | 📋 Planificado | 🔍 Backlog |
|:-:|:-:|:-:|:-:|
| 4 | 1 | 2 | 5 |

---

## 🏷️ Leyenda

### Estado

| Badge | Significado |
|---|---|
| ✅ **Implementado** | Feature en producción con tests cubiertos |
| 🚧 **Parcial** | Una parte implementada, resto pendiente |
| 📋 **Planificado** | Diseñado y priorizado, pendiente de sprint |
| 🔍 **Backlog** | Análisis documentado, sin roadmap fijo |

### Esfuerzo (⌨️ Código · 🧪 Testing)

| Talla | Código | Testing |
|:---:|---|---|
| `XS` | < 2 días | < 1 día |
| `S` | 3–5 días | 1–2 días |
| `M` | 1–2 semanas | 3–5 días |
| `L` | 3–4 semanas | 1–2 semanas |
| `XL` | > 1 mes | > 2 semanas |
| `—` | Ya entregado | Ya entregado |

### Prioridad

| Badge | Nivel |
|---|---|
| 🔴 | Alta — bloquea otras features o tiene deuda técnica activa |
| 🟡 | Media — mejora significativa sin bloqueo |
| 🟢 | Baja — nice-to-have o largo plazo |

---

## 🗂️ Inventario de Features

| # | Feature | Estado | Versión | Fecha Doc | Prioridad | ⌨️ Código | 🧪 Testing | Resumen | Doc |
|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|---|:---:|
| 1 | User Profile & Author Capture | ✅ Implementado | v2.0.5 | 2026-04-17 | — | — | — | Perfil local con 12 avatares Marvel SVG inline. Captura nombre/avatar del ejecutor en exportaciones JSON y Word. Store Zustand persistido con compresión. Animaciones slot-machine en selección aleatoria. | [📄](docs/features/user-profile-author-plan.md) |
| 2 | YAML Schema + Soporte IDE | ✅ Implementado | v2.1.x | 2026-04-20 | — | — | — | JSON Schema 2020-12 con discriminador `oneOf` por `task.type`. 14 snippets VS Code. Validación CI `npm run validate:processes`. 10/10 archivos pasan. Integración Red Hat YAML Language Server. | [📄](docs/features/yaml-schema-analysis.md) |
| 3 | Alertas de Confirmación (`completionAlert`) | ✅ Implementado | v2.1.3 | 2026-04-20 | — | — | — | Diálogo modal opcional (info / warning / critical) antes de finalizar tareas irreversibles. 100% declarativo vía YAML, reutiliza `alert-dialog` de shadcn/Radix. | [📄](docs/features/completion-alerts-and-decision-tasks.md) |
| 4 | BPMN Studio Editor | ✅ Implementado | v3.0.0–v3.0.3 | 2026-05-06 | — | — | — | Editor visual BPMN ↔ YAML bidireccional con `bpmn-js`. Token simulation, auto-sync configurable, editor YAML inline con validación en tiempo real, toolbar completa. | [📄](docs/features/plan-bpmn-studio-editor.md) |
| 5 | Tareas de Decisión (Sí/No) | 🚧 Parcial | — | 2026-04-20 | 🔴 Alta | `M` | `S` | Ramificación condicional del flujo según respuesta del usuario. YAML y diseño listos (mismo doc que `completionAlert`); UI de bifurcación y lógica de salto de tareas pendientes. | [📄](docs/features/completion-alerts-and-decision-tasks.md) |
| 6 | Social Authentication | 📋 Planificado | — | — | 🔴 Alta | `L` | `L` | OAuth 2.0 vía NextAuth (Google, Microsoft, Facebook, X). Identidad real persistida en sesión y exportaciones Word. `next-auth` v4 ya instalado. Requiere configurar providers y AuthStore Zustand. | [📄](docs/features/social-authentication-plan.md) |
| 7 | Colaboración Multi-Usuario | 📋 Planificado | — | 2026-05-04 | 🔴 Alta | `XL` | `XL` | Tiempo real multi-usuario con Prisma backend, sync optimista (CRDT), BPMN Collaboration model, RBAC por rol (admin / editor / reviewer / viewer). Depende de Social Auth. | [📄](docs/features/plan-colaboracion-multi-usuario.md) |
| 8 | Mejoras Clase Mundial | 🔍 Backlog | — | — | 🟡 Media | `XL` | `XL` | 8 áreas: arquitectura/persistencia, seguridad (CSP, RBAC, audit log), bundle optimization, rendimiento (RSC, streaming), observabilidad (Sentry, OTel), testing (a11y, visual regression), CI/CD DevSecOps (SAST/DAST/SBOM), motor de procesos formal. | [📄](docs/features/propuestas-mejora-clase-mundial.md) |
| 9 | Catálogo Empresarial + 4 Perfiles + Monetización | 🔍 Backlog | — | 2026-06-02 | 🔴 Alta | `XL` | `XL` | Multi-tenant con Turso + Prisma. 4 perfiles (Free/Profesional/Equipo/Empresarial), Open Core, tabla comparativa. Programa de referidos: créditos 1:1 por día, código personalizable DEVSEC-{slug}, bonos por hitos (Embajador 🏅/Evangelizador ⭐), social sharing con créditos, tope 90/año. Modelo de datos: ReferralCode, CreditLedger, subsidizedUntil en Org. 17 decisiones pendientes §18. | [📄](docs/features/propuesta-catalogo-empresarial.md) |
| 10 | Monetización Social — Social-First Revenue Engine | 🔍 Backlog | — | 2026-06-02 | 🟡 Media | `M→XL` | `S→L` | 16 modelos rankeados por invasividad. **Nivel 1** (sin backend, semanas 1-4): "Powered by" en reportes, OG meta tags, ShareCompletionModal LinkedIn/Twitter prefill, BPMN export PNG, GitHub Sponsors. **Nivel 2** (GitHub CDN, meses 2-4): Community Marketplace, Contributor profiles, LinkedIn Certification Badges, "Process of the Week", sponsored slots ($250-300/mes). Target: $250 MRR mes 3 → $750 MRR mes 6. | [📄](docs/features/propuesta-monetizacion-social.md) |
| 11 | Estrategia de Viralización — Viral Growth Engine | 🔍 Backlog | — | 2026-06-02 | 🔴 Alta | `M→L` | `S` | 7 Growth Loops diseñados: Loop 1 Export Attribution (K=0.05), Loop 2 GitHub Star Engine (K=0.08), Loop 3 Achievement Share LinkedIn/Twitter (K=0.25), Loop 4 BPMN Visual Share (K=0.30), Loop 5 LinkedIn Badge (K=0.40), Loop 6 Template Ecosystem Marketplace (K=0.15→0.35), Loop 7 Referral Chain (K=0.45). K-Factor progresivo: 0.02 hoy → 0.40 Fase1 → 0.85 Fase4 → 1.0+ año 2. Modelo PLG + DevRel + Growth Loops. Target: 8,000 usuarios mes 12, 80,000 mes 24. | [📄](docs/features/propuesta-estrategia-viralizacion.md) |
| 12 | Onboarding Interactivo + Gamificación — FTUE | 🔍 Backlog | — | 2026-06-02 | 🔴 Alta | `L` | `M` | 4 capas: WelcomeModal (3 slides, primera visita), WhatsNewModal (por versión), OnboardingChecklist (5 pasos + XP, auto-tracking), Product Tour (driver.js, 6 pasos). Gamificación: 5 niveles (Novato→Maestro), 12 badges (4 linkedIn-shareable), XP por 13 acciones, streak diario con freeze. 2 nuevos stores Zustand: `useOnboardingStore` + `useGamificationStore`. Sin breaking changes, todos los cambios son aditivos. Activa Loop 5 de viralización (LinkedIn Badges). | [📄](docs/features/propuesta-onboarding-gamificacion.md) |

---

## 🗓️ Roadmap Visual

```
v2.0.5  ──●── [✅] User Profile & Author Capture
            │
v2.1.x  ──●── [✅] YAML Schema + Soporte IDE
            │
v2.1.3  ──●── [✅] Alertas de Confirmación (completionAlert)
            │
v3.0.0  ──●── [✅] BPMN Studio Editor
v3.0.1       └── YAML enriquecido + Editor YAML inline
v3.0.2       └── Animaciones de perfil (dado + avatar)
v3.0.3       └── Slot-machine hero selection
            │
  ??    ──○── [🚧] Tareas de Decisión (Sí/No)          ⌨️ M  · 🧪 S
  ??    ──○── [📋] Social Authentication               ⌨️ L  · 🧪 L
  ??    ──○── [📋] Colaboración Multi-Usuario          ⌨️ XL · 🧪 XL
  ??    ──◌── [🔍] Mejoras Clase Mundial               ⌨️ XL · 🧪 XL
  ??    ──◌── [🔍] Catálogo Empresarial + 4 Perfiles   ⌨️ XL · 🧪 XL
             ├── Turso multi-tenant + Prisma schema
             └── Programa de Referidos (ReferralCode + CreditLedger)
  ??    ──◌── [🔍] Monetización Social Nivel 1         ⌨️ S  · 🧪 S
             ├── "Powered by" reportes + OG tags + GitHub Sponsors
             └── ShareCompletionModal + BPMN export PNG
  ??    ──◌── [🔍] Monetización Social Nivel 2         ⌨️ L  · 🧪 M
             ├── Community Marketplace (GitHub CDN)
             └── Contributor profiles + LinkedIn Badges
  ??    ──◌── [🔍] Estrategia de Viralización          ⌨️ M→L· 🧪 S
             ├── 7 Growth Loops (K-Factor 0.02→1.0+)
             ├── PLG + DevRel + Growth Loops model
             └── Target: 8k usuarios mes 12, 80k mes 24
  ??    ──◌── [🔍] Onboarding + Gamificación (FTUE)   ⌨️ L  · 🧪 M
             ├── WelcomeModal + WhatsNewModal + Checklist + Tour
             ├── 5 niveles · 12 badges · XP · streak diario
             └── useOnboardingStore + useGamificationStore
```

---

## 🔗 Dependencias entre Features

```
Social Authentication
    └──► Colaboración Multi-Usuario       (requiere identidad real verificada)
    └──► User Profile (mejora)            (reemplaza avatar local por identidad OAuth)
    └──► Catálogo Empresarial (habilita)  (Profesional/Equipo/Empresa requieren auth)

Tareas de Decisión
    └──► completionAlert (extiende)       (mismo flujo de intercepción en task-card)

Mejoras Clase Mundial
    └──► Colaboración (habilita)          (persistencia + seguridad necesarias como base)
    └──► Social Auth (habilita)           (RBAC y audit log requieren identidad real)

Catálogo Empresarial + 4 Perfiles
    └──► Social Authentication (requiere) (org/perfil binding necesita identidad)
    └──► Colaboración (habilita extensión) (teams sobre el mismo multi-tenant)
    └──► Programa de Referidos (incluido)  (ReferralCode + CreditLedger en mismo schema)

Monetización Social Nivel 1
    └──► Sin dependencias externas         (implementable hoy sobre el sistema actual)

Monetización Social Nivel 2
    └──► Community Marketplace (requiere)  (repo comunitario + /contributors page)
    └──► Social Authentication (mejora)    (perfil público vinculado a identidad OAuth)
    └──► Catálogo Empresarial (complementa)(sponsored slots del marketplace)

Estrategia de Viralización
    └──► Monetización Social (implementa)  (Loops 1-4 son los Niveles 1-2 de monetización)
    └──► Catálogo Empresarial (habilita)   (Loop 7 Referral Chain requiere CreditLedger)
    └──► Monetización Social Nivel 2 (extiende) (Loop 5-6 sobre community marketplace)
    └──► Sin dependencias de código propio  (Loops 1-4 son cambios menores en features existentes)

Onboarding Interactivo + Gamificación
    └──► Sin dependencias externas          (100% localStorage, sin auth ni backend)
    └──► User Profile (extiende)            (awardXP al personalizar perfil/avatar)
    └──► Estrategia de Viralización (activa) (badges LinkedIn activan Loop 5)
    └──► Monetización Social (amplifica)    (ShareCompletionModal = +25 XP)
    └──► Social Authentication (mejora futura) (streak y XP sincronizados en cuenta)
```

---

## 📁 Documentos de Diseño

| Archivo | Descripción | Fecha |
|---|---|:---:|
| [`user-profile-author-plan.md`](docs/features/user-profile-author-plan.md) | Plan e implementación del sistema de perfil de usuario | 2026-04-17 |
| [`yaml-schema-analysis.md`](docs/features/yaml-schema-analysis.md) | Análisis del schema YAML y soporte IDE | 2026-04-20 |
| [`completion-alerts-and-decision-tasks.md`](docs/features/completion-alerts-and-decision-tasks.md) | Diseño de alertas y tareas de decisión | 2026-04-20 |
| [`plan-bpmn-studio-editor.md`](docs/features/plan-bpmn-studio-editor.md) | Plan completo del BPMN Studio Editor | 2026-05-06 |
| [`social-authentication-plan.md`](docs/features/social-authentication-plan.md) | Plan de autenticación OAuth multi-proveedor | — |
| [`plan-colaboracion-multi-usuario.md`](docs/features/plan-colaboracion-multi-usuario.md) | Plan de colaboración en tiempo real | 2026-05-04 |
| [`propuestas-mejora-clase-mundial.md`](docs/features/propuestas-mejora-clase-mundial.md) | Análisis de 8 áreas de mejora estructural | — |
| [`propuesta-catalogo-empresarial.md`](docs/features/propuesta-catalogo-empresarial.md) | Catálogo Empresarial: Turso multi-tenant, 4 perfiles, Open Core, programa de referidos v0.3 | 2026-06-02 |
| [`propuesta-monetizacion-social.md`](docs/features/propuesta-monetizacion-social.md) | Monetización Social: 16 modelos escalados por invasividad, estrategia Nivel 1 y Nivel 2 v1.0 | 2026-06-02 |
| [`propuesta-estrategia-viralizacion.md`](docs/features/propuesta-estrategia-viralizacion.md) | Viralización: 7 Growth Loops, K-Factor 0.02→1.0+, PLG+DevRel, playbook por canal, AARRR v1.0 | 2026-06-02 |
| [`propuesta-onboarding-gamificacion.md`](docs/features/propuesta-onboarding-gamificacion.md) | Onboarding FTUE + Gamificación: 4 capas UX, 5 niveles, 12 badges, XP, streak, driver.js v1.0 | 2026-06-02 |

---

*Última actualización: 2026-06-02 · Versión actual: v3.0.3 · Features documentados: 12*
