# 🌊 Marejada

> **Planificador inteligente de escapadas a la costa andaluza**

Marejada es una aplicación web que ayuda a los usuarios a descubrir y planificar escapadas personalizadas por el litoral de Andalucía. A través de un chatbot de flujo guiado, el sistema recoge las preferencias del usuario y le recomienda planes costeros a su medida, filtrados mediante un sistema de etiquetas flexible.

---

## ✨ Características principales

- **🤖 Chatbot de recomendación guiada** — Flujo conversacional paso a paso que recoge preferencias (tipo de acompañantes, actividades, tranquilidad, accesibilidad) y devuelve planes personalizados.
- **🏷️ Sistema de etiquetas** — Categorización flexible con etiquetas como `familia`, `pareja`, `aventura`, `gastronomía`, `tranquilidad`, `accesible`, `naturaleza`, `deporte`, `cultural`.
- **📋 Catálogo de planes costeros** — Listado con imagen, descripción, provincia, etiquetas y valoración media. Filtrado manual como alternativa al chatbot.
- **👤 Gestión de usuarios** — Registro, inicio de sesión, perfil con favoritos e historial de valoraciones.
- **🛠️ Panel de administración** — CRUD de planes, gestión de etiquetas y moderación de contenido.

---

## 🖥️ Stack tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | React.js + Tailwind CSS |
| **Backend** | Node.js + Express.js |
| **Base de datos** | MySQL (XAMPP en local / Railway en producción) |
| **Autenticación** | JWT |

---

## 🗂️ Estructura del repositorio

```
marejada/
├── frontend/          # Aplicación React
├── backend/           # API REST con Express
└── docs/              # Documentación del proyecto
```

---

## 🚀 Instalación y puesta en marcha

### Prerrequisitos

- Node.js v18+
- MySQL (o XAMPP)
- npm o yarn

### Backend

```bash
cd backend
npm install
cp .env.example .env   # Configura las variables de entorno
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

> La API REST estará disponible en `http://localhost:3000` y el frontend en `http://localhost:5173` por defecto.

---

## 🔌 Endpoints principales de la API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/register` | Registro de usuario |
| `POST` | `/auth/login` | Inicio de sesión |
| `GET` | `/planes` | Listado de planes |
| `GET` | `/planes/:id` | Detalle de un plan |
| `GET` | `/etiquetas` | Listado de etiquetas |
| `POST` | `/valoraciones` | Añadir valoración |
| `GET` | `/usuarios/favoritos` | Favoritos del usuario |
| `*` | `/admin/*` | Rutas de administración |

---

## 🗃️ Modelo de datos (resumen)

```
usuarios ─────────────── favoritos ──── planes
                                          │
valoraciones ────────────────────────────┤
                                          │
                                    plan_etiquetas
                                          │
                                       etiquetas
```

La tabla `plan_etiquetas` implementa la relación muchos a muchos entre planes y etiquetas, núcleo del sistema de filtrado.

---

## 📌 Contexto académico

| Campo | Valor |
|-------|-------|
| **Ciclo** | Desarrollo de Aplicaciones Web / Multiplataforma |
| **Módulo** | Proyecto Integrado (PI) |
| **Profesores** | Carlos Basulto Pardo · Wilman Acosta |

---

## 📄 Licencia

Este proyecto se desarrolla con fines académicos.