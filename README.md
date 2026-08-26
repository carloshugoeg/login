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
enlace de ahí y ábrelo.

```bash
npm test                  # 47 pruebas: unitarias, integración y extremo a extremo
```

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
