// Local development database: a private PostgreSQL that lives in ./.pgdata.
// Run `npm run db` in its own terminal and leave it open while you work.
// Not used on the VPS (that has a normal PostgreSQL install).
import EmbeddedPostgres from 'embedded-postgres'
import fs from 'node:fs'
import path from 'node:path'

const dataDir = path.resolve('.pgdata')
const firstRun = !fs.existsSync(path.join(dataDir, 'PG_VERSION'))

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'rentobots',
  password: 'rentobots-local',
  port: 5433,
  persistent: true,
  // Always UTF-8 (Windows would otherwise default to WIN1252, which rejects characters like ″ or ₹).
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
})

if (firstRun) await pg.initialise()
await pg.start()
// The site uses the "rentobots_utf8" database (see .env).
const client = pg.getPgClient()
await client.connect()
const exists = await client.query("select 1 from pg_database where datname = 'rentobots_utf8'")
if (!exists.rowCount) await client.query("CREATE DATABASE rentobots_utf8 ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C'")
await client.end()

console.log('Local PostgreSQL ready on port 5433 (database: rentobots_utf8). Press Ctrl+C to stop.')

const stop = async () => {
  await pg.stop()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
