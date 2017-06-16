'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _changeCase = require('change-case');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _rocketstationApi = require('rocketstation-api');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

const convertModel = (title, { rawAttributes, tableName: table, options: { indexes = [] } }, file = '1') => {
  let migrationStr = `module.exports = Sequelize => ({
  up(queryInterface) {
    return queryInterface
      .createTable('${table}', {`;
  Object.keys(rawAttributes).forEach(item => {
    const _rawAttributes$item = rawAttributes[item],
          { type } = _rawAttributes$item,
          rest = _objectWithoutProperties(_rawAttributes$item, ['type']);
    Object.keys(rest).forEach(element => {
      if (['fieldName', 'Model', 'name'].includes(element) || element.startsWith('_')) delete rest[element];
    });
    if (typeof type !== 'undefined') {
      let typeStr = `Sequelize.${type.key}`;
      if (type.type && type.type.key) typeStr += `(Sequelize${type.type.key})`;
      migrationStr += `
        ${item}: {
          type: ${typeStr}, `;
      Object.keys(rest).forEach(element => {
        const value = rest[element];
        if (element === 'references') {
          migrationStr += `
          references: {
            model: '${(0, _changeCase.snake)(value.model)}',
            key: '${value.key}',
          },`;
        }
        if (typeof value !== 'object') {
          let propertyStr = value;
          if (['onDelete', 'onUpdate'].includes(element)) propertyStr = `'${value.toUpperCase()}'`;
          if (element === 'field' || element === 'defaultValue' && typeof value === 'string') propertyStr = `'${value}'`;
          migrationStr += `
          ${element}: ${propertyStr},`;
        }
      });
      migrationStr += `
        },`;
    }
  });
  migrationStr += `
      })`;

  const indexesStrings = indexes.map(item => `'${table}', ['${item.fields.join('\',\'')}']`);
  indexesStrings.forEach(item => {
    migrationStr += `
      .then(() => queryInterface.addIndex(${item}))`;
  });
  migrationStr += `;
  },
  down(queryInterface) {
    return queryInterface
      .dropTable('${table}')`;
  indexesStrings.forEach(item => {
    migrationStr += `
      .then(() => queryInterface.removeIndex(${item}))`;
  });
  migrationStr += `;
  },
});`;
  const dir = (0, _path.join)(process.cwd(), 'models', (0, _changeCase.param)(title), 'migrations');
  if (!_fs2.default.existsSync(dir)) _fs2.default.mkdirSync(dir);
  const [name] = file.split('.');
  _fs2.default.writeFileSync((0, _path.join)(dir, `${name}.js`), migrationStr);
};

const convert = async ({ models, options: { file } }) => {
  const { sequelize } = await (0, _rocketstationApi.load)();
  const toConvert = (models || Object.keys(sequelize.models)).map(item => (0, _changeCase.pascal)(item));
  toConvert.forEach(item => convertModel(item, _rocketstationApi.bottle.container[item], file));
};

exports.default = convert;