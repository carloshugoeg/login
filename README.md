# Registro de usuarios con validación por correo

Laboratorio de programación web. Un formulario de registro (correo, nombre,
apellidos, edad, contraseña) sobre SQLite local donde **nadie llega a la tabla
`users` hasta confirmar su correo**.

El código está organizado para que el principio de responsabilidad única (SRP)
y el principio abierto/cerrado (OCP) se vean en la estructura, no en los
comentarios. Diseño completo en
[docs/superpowers/specs/2026-08-26-registro-usuarios-design.md](docs/superpowers/specs/2026-08-26-registro-usuarios-design.md).

## Arrancar

```bash
npm install
cp .env.example .env      # opcional: los valores por omisión ya sirven
npm run dev
```

Abre <http://localhost:3000>. Con `MAIL_TRANSPORT=console` (el valor por
omisión) el correo de confirmación **se imprime en la terminal**: copia el
enlace de ahí y ábrelo. Para enviarlo de verdad, ver
[Envío real por SMTP](#envío-real-por-smtp).

```bash
npm test                  # 51 pruebas: unitarias, integración y extremo a extremo
```

## Envío real por SMTP

**1. Consigue credenciales.** Con Gmail:

- Activa la verificación en dos pasos en tu cuenta de Google.
- Entra a <https://myaccount.google.com/apppasswords> y crea una
  **contraseña de aplicación**. Son 16 letras. La contraseña normal de la
  cuenta NO funciona por SMTP.

Cualquier otro proveedor sirve igual (Brevo, Mailtrap, Resend, el SMTP de tu
universidad): solo cambian host, puerto y usuario.

**2. Rellena `.env`** — este archivo está en `.gitignore`, la contraseña no
se sube a git:

```dotenv
MAIL_TRANSPORT=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-correo@gmail.com
SMTP_PASSWORD=las16letras
MAIL_FROM="Registro Lab <tu-correo@gmail.com>"
```

**3. Comprueba el envío** antes de tocar el formulario:

```bash
npm run mail:test -- tu-correo@gmail.com
```

Verifica credenciales y conexión, manda un correo de ejemplo y, si algo
falla, explica qué revisar. Cuando esto funcione, el registro también.

**4. Reinicia el servidor** para que tome el `.env` nuevo.

### El enlace del correo y `APP_BASE_URL`

El enlace de confirmación se construye con `APP_BASE_URL`. Con el valor por
omisión (`http://localhost:3000`) el correo llega de verdad, pero **el enlace
solo abre en la máquina donde corre el servidor**. Basta si te registras tú
mismo desde tu computadora.

Para que otra persona pueda confirmar desde su teléfono o su equipo, el
servidor necesita una dirección alcanzable: un túnel (`ngrok http 3000`,
`cloudflared tunnel --url http://localhost:3000`) o un despliegue real. Pon
esa URL en `APP_BASE_URL` y reinicia.

### Si el envío falla

El registro responde `502 MAIL_DELIVERY_FAILED` y **descarta el pendiente**,
para que puedas reintentar con el mismo correo sin chocar con el registro
anterior. `npm run mail:test` da el diagnóstico detallado.

## Flujo

1. `POST /api/registrations` valida, hashea la contraseña, guarda un registro
   en `pending_registrations` y envía el correo. Responde `202`.
2. `GET /verify?code=…` promueve el pendiente a `users` dentro de una
   transacción y borra el pendiente. Responde una página HTML.
3. `POST /api/registrations/resend` reenvía el mismo enlace.
4. `GET /api/users` lista las cuentas confirmadas (sin el hash).

El código de verificación no caduca. Registrar dos veces el mismo correo
reemplaza el pendiente anterior y estrena código.

## Arquitectura

Hexagonal ligera, con la regla de dependencias
`infrastructure → application → domain`. El dominio no importa Express,
SQLite ni nodemailer.

```
src/
  domain/         entidades, errores, reglas de validación y PUERTOS
  application/    casos de uso (RegisterUser, VerifyRegistration, …)
  infrastructure/ adaptadores: SQLite, memoria, correo, seguridad, HTTP
  public/         formulario y listado (HTML/CSS/JS sin framework)
```

### Dónde está cada principio

**SRP** — `RandomCodeGenerator` solo genera códigos; `VerificationEmailTemplate`
solo redacta el mensaje; `SmtpMailSender` solo lo transporta; cada regla valida
un campo con un criterio; cada caso de uso hace una operación.

**OCP** — todo lo intercambiable pasa por un puerto y se elige en un único
archivo, [`src/infrastructure/config/container.js`](src/infrastructure/config/container.js):

| Quiero… | Toco… | NO toco… |
|---|---|---|
| Añadir "la contraseña necesita un símbolo" | un archivo nuevo en `domain/validation/rules/` + una línea en el container | `RuleSet`, casos de uso, controladores |
| Enviar por SMTP en vez de consola | `MAIL_TRANSPORT=smtp` en `.env` | ninguna línea de código |
| Añadir un tercer transporte (una API HTTP, por ejemplo) | una clase que implemente `MailSender` + una rama en `createMailSender.js` | casos de uso, plantilla, controladores |
| Cambiar bcrypt por otro algoritmo | una clase nueva que implemente `PasswordHasher` + una línea | `RegisterUser` |
| Probar sin base de datos | los adaptadores `persistence/memory/` | nada del dominio |

## Configuración

Ver [`.env.example`](.env.example). Lo mínimo: `MAIL_TRANSPORT` (`console` o
`smtp`), `DATABASE_PATH` y `APP_BASE_URL` (con la que se arma el enlace del
correo).

## Límites conocidos

- El enlace de verificación es un `GET`: un antivirus de correo que precargue
  enlaces podría activar la cuenta. En producción se resolvería con una página
  intermedia que envíe un `POST`.
- No hay inicio de sesión ni recuperación de contraseña: fuera de alcance.
- Un pendiente abandonado se queda en la tabla hasta que alguien registre otra
  vez ese mismo correo (el código no caduca, por decisión de diseño).
