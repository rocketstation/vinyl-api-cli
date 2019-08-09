import { load, loadMigrations } from 'rocketstation-api'

export const create = async () => {
  const { bottle } = await load()

  const { container: { db, pgp } } = bottle

  const connection = db.getConnection(pgp)

  await db.create(connection, pgp)

  pgp.end()
}

export const destroy = async () => {
  const { bottle } = await load()

  const { container: { db, pgp } } = bottle

  await db.delete(db.getConnection(pgp))

  pgp.end()
}

export const reset = async () => {
  const { bottle, runPending, seed } = await loadMigrations()

  const { container: { db, pgp } } = bottle

  const connection = db.getConnection(pgp)

  await db.delete(connection)

  const dbConnection = await db.create(connection, pgp)

  await runPending(dbConnection)

  pgp.end()

  return seed()
}
