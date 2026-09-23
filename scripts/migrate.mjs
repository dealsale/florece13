// Aplica las migraciones SQL de ./drizzle. Se corre en cada despliegue antes de arrancar.
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('Falta DATABASE_URL')
  process.exit(1)
}
const client = postgres(url, { max: 1 })
try {
  await migrate(drizzle(client), { migrationsFolder: './drizzle' })
  console.log('Migraciones aplicadas.')
} finally {
  await client.end()
}
