// Cuenta de administración desde variables de entorno.
//
//   ADMIN_EMAILS    correos con rol admin (separados por coma); la cuenta se crea con el primero.
//   ADMIN_PASSWORD  clave de esa cuenta (mínimo 10 caracteres).
//
// Se corre en cada despliegue desde `npm run release`:
// - si la cuenta no existe, la crea con rol ADMIN;
// - si existe, le da rol ADMIN y, si la clave cambió en la variable, la actualiza y cierra sus sesiones abiertas.
// Sin ADMIN_PASSWORD no hace nada (el admin se puede registrar en /registro con un correo de ADMIN_EMAILS).
import bcrypt from 'bcryptjs'
import postgres from 'postgres'

// En local lee .env; en Railway las variables ya vienen del entorno.
try {
  process.loadEnvFile()
} catch {}

const password = process.env.ADMIN_PASSWORD ?? ''
const email = (process.env.ADMIN_EMAILS ?? '').split(',')[0].trim().toLowerCase()
if (!password) process.exit(0)
if (!email) {
  console.warn('ADMIN_PASSWORD está definida pero ADMIN_EMAILS está vacía: no se creó la cuenta de administración.')
  process.exit(0)
}
if (password.length < 10) {
  console.warn('ADMIN_PASSWORD debe tener al menos 10 caracteres: no se creó la cuenta de administración.')
  process.exit(0)
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Falta DATABASE_URL')
  process.exit(1)
}
const sql = postgres(url, { max: 1 })
try {
  const [user] = await sql`select id, password_hash, role from users where lower(email) = ${email}`
  if (!user) {
    const hash = await bcrypt.hash(password, 12)
    await sql`insert into users (email, password_hash, name, role) values (${email}, ${hash}, ${'Administración'}, 'ADMIN')`
    console.log(`Cuenta de administración creada: ${email}`)
  } else {
    const same = await bcrypt.compare(password, user.password_hash)
    if (!same) {
      const hash = await bcrypt.hash(password, 12)
      await sql`update users set password_hash = ${hash}, role = 'ADMIN', updated_at = now() where id = ${user.id}`
      await sql`delete from sessions where user_id = ${user.id}`
      console.log(`Clave de administración actualizada: ${email}`)
    } else if (user.role !== 'ADMIN') {
      await sql`update users set role = 'ADMIN', updated_at = now() where id = ${user.id}`
      console.log(`Rol de administración asignado: ${email}`)
    } else {
      console.log(`Cuenta de administración al día: ${email}`)
    }
  }
} finally {
  await sql.end()
}
