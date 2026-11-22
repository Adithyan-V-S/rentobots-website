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
})

if (firstRun) await pg.initialise()
await pg.start()
if (firstRun) await pg.createDatabase('rentobots')

console.log('Local PostgreSQL ready on port 5433 (database: rentobots). Press Ctrl+C to stop.')

const stop = async () => {
  await pg.stop()
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
