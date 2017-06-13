import { loadMigrations } from 'rocketstation-api'

const seed = async () => {
  const { seed } = await loadMigrations()
  return seed()
}

export default seed
