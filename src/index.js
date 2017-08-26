#! /usr/bin/env node
import Vorpal from 'vorpal'

import convert from './convert'
import { create, destroy, reset } from './db'
import migrate from './migrate'
import seed from './seed'

const vorpal = Vorpal()

const onError = (error) => {
  if (error.stack) console.error(error.stack)
  else console.error(error)
  process.exit()
}

vorpal
  .command('convert [models...]', 'Converts models to migrations')
  .option('-f --file <env>', 'file name for output')
  .types({
    string: ['file', 'f']
  })
  .alias('c')
  .action(async (args) => {
    try {
      await convert(args)
      process.exit()
    } catch (error) {
      onError(error)
    }
  })

vorpal
  .command('create', 'Creates DB')
  .alias('dbc')
  .action(async () => {
    try {
      await create()
      process.exit()
    } catch (error) {
      onError(error)
    }
  })

vorpal
  .command('destroy', 'Drops DB')
  .alias('dbd')
  .action(async () => {
    try {
      await destroy()
      process.exit()
    } catch (error) {
      onError(error)
    }
  })

vorpal
  .command('reset', 'Resets DB')
  .alias('dbr')
  .action(async () => {
    try {
      await reset()
      process.exit()
    } catch (error) {
      onError(error)
    }
  })

vorpal
  .command('seed', 'Seeds DB')
  .alias('dbs')
  .action(async () => {
    try {
      await seed()
      process.exit()
    } catch (error) {
      onError(error)
    }
  })

vorpal
  .command('migrate', 'Runs specified model migrations')
  .alias('dbm')
  .option('-m --model <model>', 'model to migrate')
  .option('-t --type <type>', 'migration type')
  .option('-v --version <version>', 'migration version number')
  .types({
    string: ['m', 'model', 't', 'type', 'v', 'version']
  })
  .action(async (args) => {
    try {
      await migrate(args)
      process.exit()
    } catch (error) {
      onError(error)
    }
  })

vorpal.parse(process.argv)
