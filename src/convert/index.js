import * as changeCase from '@rocketstation/change-case'
import fs from 'fs'
import { join } from 'path'
import { bottle, load } from 'rocketstation-api'

const convertModel = (title, { rawAttributes, tableName: table, options: { indexes = [] } }, file = '1') => {
  let migrationStr = `module.exports = Sequelize => ({
  up (queryInterface) {
    return queryInterface
      .createTable('${table}', {`
  Object.keys(rawAttributes).sort((a, b) => a > b).forEach((item) => {
    const { type, ...rest } = rawAttributes[item]
    Object.keys(rest).forEach((element) => {
      if (['fieldName', 'Model', 'name'].includes(element) || element.startsWith('_')) delete rest[element]
    })
    if (typeof type !== 'undefined' && type.key !== 'VIRTUAL') {
      let typeStr = `Sequelize.${type.key}`
      if (type.type && type.type.key) typeStr += `(Sequelize.${type.type.key})`
      migrationStr += `
        ${item}: {
          type: ${typeStr},`
      Object.keys(rest).sort((a, b) => a > b).forEach((element) => {
        const value = rest[element]
        if (element === 'references') {
          migrationStr += `
          references: {
            model: '${changeCase.sl(value.model)}',
            key: '${value.key}',
          },`
        }
        if (typeof value !== 'object') {
          let propertyStr = value
          if (typeof value === 'string') propertyStr = `'${value}'`
          if (['onDelete', 'onUpdate'].includes(element)) propertyStr = propertyStr.toUpperCase()
          migrationStr += `
          ${element}: ${propertyStr},`
        } else {
          if (element === 'defaultValue' && Array.isArray(value) && value.length === 0) {
            migrationStr += `
          ${element}: [],`
          }
        }
      })
      migrationStr += `
        },`
    }
  })
  migrationStr += `
      })`

  indexes.forEach(({ fields, type, unique }) => {
    migrationStr += `
      .then(() => queryInterface.addIndex('${table}', { fields: ['${fields.join('\', \'')}']${type ? `, type: '${type}'` : ''}${unique ? `, unique: ${unique}` : ''} }))`
  })
  migrationStr += `
  },
  down (queryInterface) {
    return queryInterface.dropTable('${table}')
  },
})`
  const dir = join(process.cwd(), 'models', changeCase.k(title), 'migrations')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir)
  const [name] = file.split('.')
  fs.writeFileSync(join(dir, `${name}.js`), migrationStr)
}

const convert = async ({ models, options: { file } }) => {
  const { sequelize } = await load()
  const toConvert = (models || Object.keys(sequelize.models)).map((item) => changeCase.p(item))
  toConvert.forEach((item) => convertModel(item, bottle.container[item], file))
}

export default convert
