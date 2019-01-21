'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _changeCase = require('@rocketstation/change-case');

var changeCase = _interopRequireWildcard(_changeCase);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _rocketstationApi = require('rocketstation-api');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

const convertModel = (title, { rawAttributes, tableName: table, options: { indexes = [] } }, file = '1') => {
  let migrationStr = `module.exports = Sequelize => ({
  up (queryInterface) {
    return queryInterface
      .createTable('${table}', {`;
  Object.keys(rawAttributes).sort((a, b) => a > b).forEach(item => {
    const _rawAttributes$item = rawAttributes[item],
          { type } = _rawAttributes$item,
          rest = _objectWithoutProperties(_rawAttributes$item, ['type']);
    Object.keys(rest).forEach(element => {
      if (['fieldName', 'Model', 'name'].includes(element) || element.startsWith('_')) delete rest[element];
    });
    if (typeof type !== 'undefined') {
      let typeStr = `Sequelize.${type.key}`;
      if (type.type && type.type.key) typeStr += `(Sequelize.${type.type.key})`;
      migrationStr += `
        ${item}: {
          type: ${typeStr},`;
      Object.keys(rest).sort((a, b) => a > b).forEach(element => {
        const value = rest[element];
        if (element === 'references') {
          migrationStr += `
          references: {
            model: '${changeCase.sl(value.model)}',
            key: '${value.key}',
          },`;
        }
        if (typeof value !== 'object') {
          let propertyStr = value;
          if (typeof value === 'string') propertyStr = `'${value}'`;
          if (['onDelete', 'onUpdate'].includes(element)) propertyStr = propertyStr.toUpperCase();
          migrationStr += `
          ${element}: ${propertyStr},`;
        } else {
          if (element === 'defaultValue' && Array.isArray(value) && value.length === 0) {
            migrationStr += `
          ${element}: [],`;
          }
        }
      });
      migrationStr += `
        },`;
    }
  });
  migrationStr += `
      })`;

  indexes.forEach(({ fields, type, unique }) => {
    migrationStr += `
      .then(() => queryInterface.addIndex('${table}', { fields: ['${fields.join('\', \'')}']${type ? `, type: '${type}'` : ''}${unique ? `, unique: ${unique}` : ''} }))`;
  });
  migrationStr += `
  },
  down (queryInterface) {
    return queryInterface.dropTable('${table}')
  },
})`;
  const dir = (0, _path.join)(process.cwd(), 'models', changeCase.k(title), 'migrations');
  if (!_fs2.default.existsSync(dir)) _fs2.default.mkdirSync(dir);
  const [name] = file.split('.');
  _fs2.default.writeFileSync((0, _path.join)(dir, `${name}.js`), migrationStr);
};

const convert = async ({ models, options: { file } }) => {
  const { sequelize } = await (0, _rocketstationApi.load)();
  const toConvert = (models || Object.keys(sequelize.models)).map(item => changeCase.p(item));
  toConvert.forEach(item => convertModel(item, _rocketstationApi.bottle.container[item], file));
};

exports.default = convert;