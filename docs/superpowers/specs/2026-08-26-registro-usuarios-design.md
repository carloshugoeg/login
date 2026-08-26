# Registro de usuarios con validación por correo — Diseño

Fecha: 2026-08-26
Estado: aprobado

## 1. Objetivo

Una página web que permite registrar usuarios nuevos (correo, nombre,
apellidos, edad, contraseña) sobre una base de datos local. Un registro no
se convierte en usuario hasta que la persona confirma su correo mediante un
enlace de validación.

El proyecto es un laboratorio de programación web: la organización del
código prioriza el principio de responsabilidad única (SRP) y el principio
abierto/cerrado (OCP) por encima de la brevedad.

## 2. Alcance

Dentro:

- Formulario de registro y su validación.
- Envío del correo de validación.
- Confirmación mediante enlace y promoción a usuario.
- Reenvío del correo de validación.
- Listado de usuarios ya verificados.

Fuera:

- Inicio de sesión, sesiones y autenticación.
- Recuperación de contraseña.
- Roles y permisos.
- Edición o baja de usuarios.

## 3. Stack

- Node.js con Express.
- SQLite mediante `better-sqlite3` (base de datos local en archivo).
- `bcrypt` para el hash de contraseñas.
- `nodemailer` únicamente como transporte SMTP, oculto tras un puerto propio.
- Frontend en HTML, CSS y JavaScript sin framework ni paso de build.
- Pruebas con `node:test` y `supertest`.

## 4. Arquitectura

Arquitectura hexagonal ligera. La regla de dependencias es
`infrastructure → application → domain`: el dominio no importa Express,
SQLite ni nodemailer.

```
src/
  domain/
    entities/            User.js, PendingRegistration.js
    errors/              DomainError.js, EmailAlreadyRegisteredError.js,
                         InvalidRegistrationError.js, TokenNotFoundError.js,
                         PendingRegistrationNotFoundError.js
    validation/          Rule.js, RuleSet.js, ValidationResult.js, rules/
    ports/               UserRepository.js, PendingRegistrationRepository.js,
                         MailSender.js, CodeGenerator.js, PasswordHasher.js,
                         MessageTemplate.js
  application/
    RegisterUser.js, VerifyRegistration.js, ResendVerification.js, ListUsers.js
  infrastructure/
    persistence/sqlite/  Database.js, SqliteUserRepository.js,
                         SqlitePendingRegistrationRepository.js, migrations/
    persistence/memory/  InMemoryUserRepository.js,
                         InMemoryPendingRegistrationRepository.js
    mail/                ConsoleMailSender.js, SmtpMailSender.js,
                         templates/VerificationEmailTemplate.js
    security/            RandomCodeGenerator.js, BcryptPasswordHasher.js
    http/                server.js, routes/, controllers/,
                         middleware/errorHandler.js
    config/              container.js, env.js
  public/                index.html, users.html, css/, js/
tests/
  unit/, integration/, e2e/
```

Los puertos son clases cuyos métodos lanzan `NotImplementedError`. Así el
contrato queda documentado en JavaScript puro y un adaptador incompleto
falla de forma ruidosa.

`container.js` es el composition root: el único archivo que decide qué
implementación concreta recibe cada caso de uso.

### 4.1 Dónde vive cada principio

SRP:

- `RandomCodeGenerator` solo genera códigos.
- `VerificationEmailTemplate` solo arma asunto y cuerpo del mensaje.
- `SmtpMailSender` solo transporta un mensaje ya armado.
- Cada caso de uso ejecuta una sola operación de negocio.
- Cada regla de validación comprueba un solo campo con un solo criterio.

OCP:

- `RuleSet` recorre las reglas que le inyectan. Añadir "la contraseña
  necesita un símbolo" es un archivo nuevo en `rules/` más una línea en el
  container: cero cambios en el validador y en los casos de uso.
- `MailSender` permite alternar consola y SMTP cambiando solo el container.
- `PasswordHasher` permite cambiar bcrypt por otro algoritmo sin tocar
  `RegisterUser`.
- Los repositorios tienen implementación SQLite y en memoria; las pruebas
  usan la segunda sin que el código de aplicación lo note.

## 5. Componentes propios

`CodeGenerator` (puerto) con `RandomCodeGenerator` como implementación:
`crypto.randomBytes(32)` codificado en base64url. Sin librerías de tokens.

`MailSender` (puerto) con dos implementaciones:

- `ConsoleMailSender`: imprime destinatario, asunto y enlace en la terminal.
  Es el valor por omisión en desarrollo.
- `SmtpMailSender`: envía por SMTP usando nodemailer como transporte.

El contenido del correo no lo decide el sender. Lo produce
`VerificationEmailTemplate`, que implementa el puerto `MessageTemplate` y
devuelve `{ subject, text, html }`.

## 6. Modelo de datos

Migración `001_init.sql`:

```sql
CREATE TABLE pending_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  age        INTEGER NOT NULL,
  password_hash TEXT NOT NULL,
  verification_code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  age        INTEGER NOT NULL,
  password_hash TEXT NOT NULL,
  created_at  TEXT NOT NULL,
  verified_at TEXT NOT NULL
);
```

`users` solo recibe filas ya validadas. La promoción de pendiente a usuario
ocurre en una única transacción: insertar en `users` y borrar el pendiente.

El código de verificación no caduca; no existe columna de expiración.

## 7. Reglas de validación

Una clase por regla en `domain/validation/rules/`:

- `EmailFormatRule`: presente y con formato de correo válido.
- `RequiredNameRule`: nombre y apellidos no vacíos, máximo 80 caracteres.
- `AgeRangeRule`: entero entre 13 y 120 inclusive.
- `PasswordStrengthRule`: mínimo 8 caracteres, al menos una letra y un
  dígito.

`RuleSet` acumula todos los errores y devuelve un mapa
`{ campo: [mensajes] }`. No se detiene en el primer fallo.

## 8. Flujo y endpoints

| Método | Ruta | Comportamiento |
|---|---|---|
| POST | `/api/registrations` | Valida la entrada. Si el correo ya pertenece a un usuario verificado, responde 409. Si existe un pendiente con ese correo, lo reemplaza y regenera el código. Hashea la contraseña, guarda el pendiente, envía el correo y responde 202. |
| GET | `/verify?code=…` | Busca el pendiente por código. Si existe, lo promueve a `users` y devuelve una página HTML de éxito. Si no, una página de error. |
| POST | `/api/registrations/resend` | Reenvía el correo con el mismo código. 404 si no hay pendiente para ese correo. |
| GET | `/api/users` | Devuelve los usuarios verificados sin `password_hash`. |

`GET /verify` es idempotente desde fuera: un segundo clic encuentra el
código ya consumido y muestra "código no válido o ya usado".

La contraseña nunca viaja en el correo ni se almacena en claro. El hash se
calcula antes de guardar el pendiente.

## 9. Frontend

`public/index.html` contiene el formulario. Su JavaScript envía la petición
con `fetch`, pinta los errores por campo devueltos por el servidor y, en
caso de éxito, muestra el mensaje de "revisa tu correo" junto al botón de
reenvío.

`public/users.html` consume `/api/users` y muestra la tabla de usuarios
verificados.

## 10. Manejo de errores

Cada error de dominio hereda de `DomainError` y lleva `code` y `status`. Un
único middleware `errorHandler` los traduce a
`{ error: { code, message, fields? } }`.

Cualquier excepción que no sea de dominio produce un 500 genérico y queda
registrada en el log del servidor. No se exponen trazas al cliente.

Mapeo:

| Error | Código HTTP |
|---|---|
| `InvalidRegistrationError` | 422 |
| `EmailAlreadyRegisteredError` | 409 |
| `TokenNotFoundError` | 404 (página HTML de error en `/verify`) |
| `PendingRegistrationNotFoundError` | 404 |

## 11. Configuración

`env.js` lee y valida las variables de entorno con valores por omisión aptos
para desarrollo:

- `PORT` (3000)
- `DATABASE_PATH` (`./data/app.db`)
- `APP_BASE_URL` (`http://localhost:3000`), usada para construir el enlace
  de verificación.
- `MAIL_TRANSPORT` (`console` o `smtp`, por omisión `console`).
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`,
  requeridas solo cuando `MAIL_TRANSPORT=smtp`.

## 12. Pruebas

Unitarias:

- Cada regla de validación, casos válidos e inválidos.
- `RuleSet`, que acumula errores de varias reglas.
- `RandomCodeGenerator`: longitud y unicidad entre invocaciones.
- Cada caso de uso contra repositorios en memoria y un `FakeMailSender` que
  captura los mensajes en un array.

Integración:

- Los repositorios SQLite contra una base de datos en archivo temporal,
  incluida la atomicidad de la promoción pendiente a usuario.

Extremo a extremo con supertest:

- Registrar, leer el código del `FakeMailSender`, visitar `/verify`,
  comprobar que el usuario aparece en `/api/users` y que
  `pending_registrations` quedó vacía.
- Caso negativo: sin verificar, `/api/users` sigue vacío.
- Registro duplicado de un correo ya verificado devuelve 409.
- Entrada inválida devuelve 422 con los campos afectados.

## 13. Compromisos asumidos

El enlace de verificación es un `GET`. Un antivirus de correo que precargue
enlaces podría activar la cuenta sin intervención de la persona. Es
aceptable para un laboratorio; en producción se resolvería con una página
intermedia que envíe un `POST`.

El código de verificación no caduca, por decisión explícita. Un pendiente
abandonado permanece en la tabla hasta que alguien vuelva a registrar ese
mismo correo.
