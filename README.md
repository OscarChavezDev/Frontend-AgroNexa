# AgroNexa — Frontend

Frontend web de la plataforma **AgroNexa**, sistema de diagnóstico agrícola para registro de parcelas, muestras de campo y generación de diagnósticos preliminares.

---

## 1. Tecnologías

| Herramienta | Uso |
|---|---|
| Angular 21 | Framework principal |
| TypeScript | Lenguaje |
| Angular Router | Navegación y guards |
| ReactiveFormsModule | Formularios reactivos |
| HttpClientModule | Comunicación con la API |
| SCSS | Estilos |

---

## 2. Requisitos

- Node.js 18+
- Angular CLI 21+
- Backend AgroNexa corriendo en `http://localhost:5000`

---

## 3. Instalación

```bash
npm install
```

---

## 4. Servidor de desarrollo

```bash
ng serve
```

Disponible en `http://localhost:4200`.

---

## 5. Estructura del proyecto

```
src/app/
├── core/
│   ├── guards/
│   │   ├── auth.guard.ts          # Protege rutas autenticadas
│   │   └── no-auth.guard.ts       # Redirige si ya está logueado
│   ├── interceptors/
│   │   └── auth.interceptor.ts    # Agrega JWT a cada request
│   ├── models/
│   │   ├── api-response.model.ts  # Respuesta estándar { success, message, data }
│   │   ├── user.model.ts
│   │   ├── parcela.model.ts
│   │   ├── muestra.model.ts
│   │   ├── diagnostico.model.ts
│   │   └── suscripcion.model.ts
│   └── services/
│       ├── api.service.ts         # FUENTE ÚNICA — todos los endpoints + HttpClient
│       ├── auth.service.ts
│       ├── parcelas.service.ts
│       ├── muestras.service.ts
│       ├── diagnosticos.service.ts
│       ├── imagenes.service.ts
│       ├── suscripciones.service.ts
│       └── users.service.ts
├── layouts/
│   └── main-layout/               # Sidebar + topbar + router-outlet
└── pages/
    ├── login/
    ├── register/
    ├── dashboard/
    ├── parcelas/
    ├── parcela-form/
    ├── parcela-detail/
    ├── muestras/
    ├── muestra-form/
    ├── muestra-detail/
    ├── planes/
    └── perfil/
```

---

## 6. Arquitectura de servicios

Todos los endpoints están centralizados en un solo lugar:

```typescript
// api.service.ts
export const endpoint = {
  AUTH_LOGIN:           'auth/login',
  AUTH_REGISTER:        'auth/register',
  AUTH_ME:              'auth/me',
  PARCELAS:             'parcelas',
  PARCELA_BY_ID:        'parcelas',   // + /{id}
  MUESTRAS:             'muestras',
  DIAGNOSTICOS_GENERAR: 'diagnosticos/generar', // + /{muestraId}
  // ...
};
```

Los servicios de dominio **no usan HttpClient directamente** — solo llaman a `ApiService`:

```typescript
// parcelas.service.ts
listar() {
  return this.api.get<ApiResponse<Parcela[]>>(endpoint.PARCELAS);
}
```

---

## 7. Rutas

| Ruta | Componente | Auth |
|---|---|---|
| `/login` | LoginComponent | No |
| `/register` | RegisterComponent | No |
| `/dashboard` | DashboardComponent | JWT |
| `/parcelas` | ParcelasComponent | JWT |
| `/parcelas/nueva` | ParcelaFormComponent | JWT |
| `/parcelas/:id` | ParcelaDetailComponent | JWT |
| `/parcelas/:id/editar` | ParcelaFormComponent | JWT |
| `/muestras` | MuestrasComponent | JWT |
| `/muestras/nueva` | MuestraFormComponent | JWT |
| `/muestras/:id` | MuestraDetailComponent | JWT |
| `/planes` | PlanesComponent | JWT |
| `/perfil` | PerfilComponent | JWT |

---

## 8. Variables de entorno

`src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000/api'
};
```

---

## 9. Flujo de autenticación

1. `POST /api/auth/login` → recibe `{ token, rol, plan }`
2. Guarda el token en `localStorage`
3. Llama `GET /api/auth/me` → obtiene el usuario completo
4. `AuthInterceptor` agrega `Authorization: Bearer <token>` a cada request
5. Si el backend devuelve `401`, el interceptor llama `logout()` automáticamente

---

## 10. Build

```bash
ng build
```

Artefactos en `dist/Front-AgroNexa/browser/`.
