# 🌊 Marejada — Backend API

API REST para el planificador inteligente de escapadas a la costa andaluza.

## Stack
- **Node.js** + **Express.js**
- **MySQL** (XAMPP en local, Railway en producción)
- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas

---

## Instalación

```bash
# 1. Entrar en la carpeta del backend
cd backend

# 2. Instalar dependencias
npm install

# 3. Crear el archivo de entorno a partir del ejemplo
cp .env.example .env
# → Edita .env con tus credenciales de MySQL y un JWT_SECRET seguro

# 4. Importar la base de datos en XAMPP
#    Abre phpMyAdmin y ejecuta el archivo marejada.sql (en /docs)

# 5. Arrancar en modo desarrollo
npm run dev

# o en producción
npm start
```

El servidor arranca en **http://localhost:3001** por defecto.

---

## Variables de entorno (`.env`)

| Variable        | Descripción                              | Ejemplo                  |
|-----------------|------------------------------------------|--------------------------|
| `PORT`          | Puerto del servidor                      | `3001`                   |
| `DB_HOST`       | Host de MySQL                            | `localhost`              |
| `DB_PORT`       | Puerto de MySQL                          | `3306`                   |
| `DB_USER`       | Usuario de MySQL                         | `root`                   |
| `DB_PASSWORD`   | Contraseña de MySQL                      | *(vacío en XAMPP)*       |
| `DB_NAME`       | Nombre de la base de datos               | `marejada`               |
| `JWT_SECRET`    | Clave secreta para firmar tokens         | `una_clave_muy_segura`   |
| `JWT_EXPIRES_IN`| Expiración del token                     | `7d`                     |
| `CORS_ORIGIN`   | URL del frontend permitida               | `http://localhost:5173`  |

---

## Endpoints de la API

### Autenticación — `/auth`

| Método | Ruta            | Auth | Descripción                        |
|--------|-----------------|------|------------------------------------|
| POST   | `/auth/register`| No   | Registrar nuevo usuario            |
| POST   | `/auth/login`   | No   | Iniciar sesión, devuelve JWT       |
| GET    | `/auth/me`      | ✅   | Datos del usuario autenticado      |

**Body register / login:**
```json
{ "nombre": "Ana", "email": "ana@ejemplo.com", "password": "segura123" }
```

---

### Planes — `/planes`

| Método | Ruta          | Auth | Descripción                                      |
|--------|---------------|------|--------------------------------------------------|
| GET    | `/planes`     | No   | Listar planes (filtros: provincia, etiquetas)    |
| GET    | `/planes/:id` | No   | Detalle de un plan con valoraciones              |

**Query params GET /planes:**
```
?provincia=Cádiz&etiquetas=familia,aventura&page=1&limit=12
```

---

### Etiquetas — `/etiquetas`

| Método | Ruta         | Auth | Descripción         |
|--------|--------------|------|---------------------|
| GET    | `/etiquetas` | No   | Listar etiquetas    |

---

### Valoraciones — `/valoraciones`

| Método | Ruta                         | Auth | Descripción                      |
|--------|------------------------------|------|----------------------------------|
| GET    | `/valoraciones/plan/:planId` | No   | Valoraciones públicas de un plan |
| POST   | `/valoraciones`              | ✅   | Crear valoración                 |
| PUT    | `/valoraciones/:id`          | ✅   | Editar propia valoración         |
| DELETE | `/valoraciones/:id`          | ✅   | Eliminar propia valoración       |

**Body POST:**
```json
{ "plan_id": 1, "puntuacion": 4, "comentario": "Muy bonito lugar" }
```

---

### Usuarios — `/usuarios`

| Método | Ruta                            | Auth | Descripción                    |
|--------|---------------------------------|------|--------------------------------|
| GET    | `/usuarios/perfil`              | ✅   | Ver perfil propio              |
| PUT    | `/usuarios/perfil`              | ✅   | Actualizar nombre / contraseña |
| GET    | `/usuarios/favoritos`           | ✅   | Listar planes favoritos        |
| POST   | `/usuarios/favoritos/:planId`   | ✅   | Añadir a favoritos             |
| DELETE | `/usuarios/favoritos/:planId`   | ✅   | Eliminar de favoritos          |
| GET    | `/usuarios/mis-valoraciones`    | ✅   | Historial de valoraciones      |

---

### Chatbot — `/chatbot`

| Método | Ruta                  | Auth | Descripción                              |
|--------|-----------------------|------|------------------------------------------|
| GET    | `/chatbot/preguntas`  | No   | Flujo de preguntas para el frontend      |
| POST   | `/chatbot/recomendar` | No   | Recibe respuestas, devuelve planes       |

**Body POST /chatbot/recomendar:**
```json
{
  "respuestas": {
    "acompañantes": "familia",
    "actividades": ["baño", "gastronomía"],
    "tranquilidad": "alta",
    "accesible": "si"
  }
}
```

---

### Panel Admin — `/admin` *(requiere rol admin)*

| Método | Ruta                                    | Descripción                        |
|--------|-----------------------------------------|------------------------------------|
| GET    | `/admin/planes`                         | Listar todos los planes            |
| POST   | `/admin/planes`                         | Crear plan                         |
| PUT    | `/admin/planes/:id`                     | Editar plan                        |
| DELETE | `/admin/planes/:id`                     | Eliminar plan                      |
| POST   | `/admin/etiquetas`                      | Crear etiqueta                     |
| PUT    | `/admin/etiquetas/:id`                  | Editar etiqueta                    |
| DELETE | `/admin/etiquetas/:id`                  | Eliminar etiqueta                  |
| GET    | `/admin/valoraciones`                   | Listar valoraciones                |
| PATCH  | `/admin/valoraciones/:id/visibilidad`   | Ocultar / publicar valoración      |
| DELETE | `/admin/valoraciones/:id`               | Eliminar valoración                |
| GET    | `/admin/usuarios`                       | Listar usuarios                    |
| PATCH  | `/admin/usuarios/:id/rol`               | Cambiar rol de usuario             |

**Body POST /admin/planes:**
```json
{
  "titulo": "Playa de los Caños de Meca",
  "descripcion": "Playa salvaje en el Parque Natural de la Breña...",
  "provincia": "Cádiz",
  "imagen_url": "https://ejemplo.com/imagen.jpg",
  "etiquetas": ["naturaleza", "aventura", "tranquilidad"]
}
```

---

## Estructura del proyecto

```
backend/
├── src/
│   ├── app.js                    ← Punto de entrada
│   ├── config/
│   │   └── db.js                 ← Conexión MySQL (pool)
│   ├── middleware/
│   │   ├── auth.js               ← Verificación JWT
│   │   └── admin.js              ← Verificación rol admin
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── planesController.js
│   │   ├── etiquetasController.js
│   │   ├── valoracionesController.js
│   │   ├── usuariosController.js
│   │   ├── adminController.js
│   │   └── chatbotController.js
│   └── routes/
│       ├── auth.js
│       ├── planes.js
│       ├── etiquetas.js
│       ├── valoraciones.js
│       ├── usuarios.js
│       ├── admin.js
│       └── chatbot.js
├── .env.example
├── .gitignore
└── package.json
```

---

## Cómo usar el token JWT

Incluye la cabecera en todas las peticiones protegidas:

```
Authorization: Bearer <tu_token>
```
