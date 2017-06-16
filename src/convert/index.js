import { param, pascal, snake } from 'change-case'
import fs from 'fs'
import { join } from 'path'
import { bottle, load } from 'rocketstation-api'

const convertModel = (title, { rawAttributes, tableName: table, options: { indexes = [] } }, file = '1') => {
  let migrationStr = `module.exports = Sequelize => ({
  up(queryInterface) {
    return queryInterface
      .createTable('${table}', {`
  Object.keys(rawAttributes).forEach((item) => {
    const { type, ...rest } = rawAttributes[item]
    Object.keys(rest).forEach((element) => {
      if (['fieldName', 'Model', 'name'].includes(element) || element.startsWith('_')) delete rest[element]
    })
    if (typeof type !== 'undefined') {
      let typeStr = `Sequelize.${type.key}`
      if (type.type && type.type.key) typeStr += `(Sequelize.${type.type.key})`
      migrationStr += `
        ${item}: {
          type: ${typeStr}, `
      Object.keys(rest).forEach((element) => {
        const value = rest[element]
        if (element === 'references') {
          migrationStr += `
          references: {
            model: '${snake(value.model)}',
            key: '${value.key}',
          },`
        }
        if (typeof value !== 'object') {
          let propertyStr = value
          if (['onDelete', 'onUpdate'].includes(element)) propertyStr = `'${value.toUpperCase()}'`
          if (element === 'field' || (element === 'defaultValue' && typeof value === 'string')) propertyStr = `'${value}'`
          migrationStr += `
          ${element}: ${propertyStr},`
        }
      })
      migrationStr += `
        },`
    }
  })
  migrationStr += `
      })`

  const indexesStrings = indexes.map((item) => `'${table}', ['${item.fields.join('\',\'')}']`)
  indexesStrings.forEach((item) => {
    migrationStr += `
      .then(() => queryInterface.addIndex(${item}))`
  })
  migrationStr += `;
  },
  down(queryInterface) {
    return queryInterface
      .dropTable('${table}')`
  indexesStrings.forEach((item) => {
    migrationStr += `
      .then(() => queryInterface.removeIndex(${item}))`
  })
  migrationStr += `;
  },
});`
  const dir = join(process.cwd(), 'models', param(title), 'migrations')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir)
  const [name] = file.split('.')
  fs.writeFileSync(join(dir, `${name}.js`), migrationStr)
}

const convert = async ({ models, options: { file } }) => {
  const { sequelize } = await load()
  const toConvert = (models || Object.keys(sequelize.models)).map((item) => pascal(item))
  toConvert.forEach((item) => convertModel(item, bottle.container[item], file))
}

export default convert
