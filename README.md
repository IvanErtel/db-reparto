**🚚 DB Reparto — Aplicación de gestión de rutas y reparto de diarios**

**DB Reparto** es una aplicación web moderna creada en **Angular 17 (standalone)** con integración completa en **Firebase**.\
Permite administrar rutas, direcciones, días de entrega, reparto diario, seguimiento de progreso y orden de entrega mediante *drag & drop*.

Optimizada para **uso móvil**, funciona como una **PWA** instalable estilo app nativa, ideal para repartidores.

-----
**🧰 Tecnologías utilizadas**

|**Tecnología**|**Descripción**|
| :-: | :-: |
|**Angular 17 (standalone components)**|Framework principal|
|**Firebase**|Autenticación, Firestore, Hosting|
|**Firestore**|Almacenamiento de rutas, direcciones y configuración|
|**Firebase Auth (Google Login)**|Acceso exclusivo para usuarios autorizados|
|**Firebase Hosting**|Despliegue del proyecto|
|**Angular Service Worker**|Funcionalidades PWA|
|**TypeScript**|Lenguaje principal|
|**CSS Moderno + diseño mobile-first**|Interfaz rápida y limpia|

-----
**✨ Características principales**

**🗺️ 1. Gestión de rutas**

- Crear rutas personalizadas
- Editarlas (nombre y zona base)
- Eliminarlas
- Ver cantidad total de direcciones
- Orden dinámico por indiceOrden
-----
**🏠 2. Direcciones dentro de cada ruta**

Cada dirección incluye:

- Cliente
- Dirección exacta
- Cantidad de diarios
- Días de entrega
- Coordenadas GPS (opcional)
- Notas
- Indicadores especiales:
  - **No entregar en festivos**
  - **Guardar sáb-dom para entregar los lunes**
-----
**📍 3. Reparto diario (función principal)**

Cuando comienza el reparto, la app:

- Filtra solo las direcciones que **corresponden al día**
- Excluye automáticamente:
  - direcciones que **no se entregan en festivos**
  - direcciones que no corresponden al día actual
- Muestra:
  - Dirección actual
  - Botón "Entregado"
  - Botón "Saltar"
  - Botón "Anterior"
  - Vista previa de próximas direcciones
- Guarda progreso automáticamente en localStorage
- Anima los cambios para mejor feedback visual
-----
**🔄 4. Ordenar direcciones (subir / bajar / drag)**

Cada dirección mantiene un campo:

indiceOrden: number

La app permite reorganizar direcciones:

- Subir (cambia indiceOrden -1)
- Bajar (cambia indiceOrden +1)
- Guarda automáticamente el nuevo orden en Firestore

Esto permite definir el orden real del recorrido.

-----
**🎉 5. Soporte de festivos automático**

Firestore contiene:

config/festivos → { dias: ["YYYY-MM-DD", ...] }

La app:

- Chequea si la fecha actual es festiva
- Si es festivo:
  - Se excluyen direcciones con noEntregarFestivos = true
  - Se incluyen solo si festivos = true
-----
**🔔 6. Sistema de notificaciones Toast**

Reemplaza todos los alert() por un sistema moderno:

- Éxito
- Error
- Información

Los toasts desaparecen automáticamente.

-----
**📱 7. PWA completa**

✔ Instalación como app nativa\
✔ Ícono personalizado\
✔ Splash screen\
✔ Offline básico\
✔ Actualización automática al publicar nueva versión

-----
**🍔 8. Menú hamburguesa global**

Incluye:

- Dashboard
- Mis rutas
- Login / Logout
- Toggle de panel lateral
- Se oculta automáticamente en pantallas donde no corresponde (login)
-----
**📂 Estructura principal del proyecto**

src/

` `├── app/

` `│    ├── routes/

` `│    │     ├── list/

` `│    │     ├── detalle/

` `│    │     ├── agregar/

` `│    │     ├── editar/

` `│    │     └── editar-ruta/

` `│    ├── reparto/

` `│    ├── menu/

` `│    ├── shared/

` `│    │     ├── toast.component.ts

` `│    │     └── toast.service.ts

` `│    ├── dashboard/

` `│    ├── login/

` `│    └── app.ts / app.html / app.scss

` `│

` `├── manifest.webmanifest

` `├── styles.scss

` `└── assets/

`      `└── icons/

-----
**🚀 Deploy en Firebase Hosting**

**1. Compilar producción**

ng build --configuration production

**2. Subir a Firebase**

firebase deploy

-----
**🔧 Configuraciones clave**

**🔹 Rutas protegidas con AuthGuard**

Solo usuarios autorizados pueden acceder a las rutas y reparto.

**🔹 Firestore organiza datos así:**

routes/

`   `{rutaId}/

`      `stops/

`         `{direccionId}

config/

`   `festivos/

-----
**👨‍💻 Autor**

**Alan Iván Ertel Ramírez**\
Desarrollador y creador de **DB Reparto**.

-----
**📄 Licencia**

Proyecto privado — uso interno para gestión de rutas y reparto.

