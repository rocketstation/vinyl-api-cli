#! /usr/bin/env node
'use strict';

var _vorpal = require('vorpal');

var _vorpal2 = _interopRequireDefault(_vorpal);

var _convert = require('./convert');

var _convert2 = _interopRequireDefault(_convert);

var _db = require('./db');

var _migrate = require('./migrate');

var _migrate2 = _interopRequireDefault(_migrate);

var _seed = require('./seed');

var _seed2 = _interopRequireDefault(_seed);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const vorpal = (0, _vorpal2.default)();

const onError = error => {
  if (error.stack) console.error(error.stack);else console.error(error);
  process.exit();
};

vorpal.command('convert [models...]', 'Converts models to migrations').option('-f --file <env>', 'file name for output').types({
  string: ['file', 'f']
}).alias('c').action(async args => {
  try {
    await (0, _convert2.default)(args);
    process.exit();
  } catch (error) {
    onError(error);
  }
});

vorpal.command('create', 'Creates DB').alias('dbc').action(async () => {
  try {
    await (0, _db.create)();
    process.exit();
  } catch (error) {
    onError(error);
  }
});

vorpal.command('destroy', 'Drops DB').alias('dbd').action(async () => {
  try {
    await (0, _db.destroy)();
    process.exit();
  } catch (error) {
    onError(error);
  }
});

vorpal.command('reset', 'Resets DB').alias('dbr').action(async () => {
  try {
    await (0, _db.reset)();
    process.exit();
  } catch (error) {
    onError(error);
  }
});

vorpal.command('seed', 'Seeds DB').alias('dbs').action(async () => {
  try {
    await (0, _seed2.default)();
    process.exit();
  } catch (error) {
    onError(error);
  }
});

vorpal.command('migrate', 'Runs specified model migrations').alias('dbm').option('-m --model <model>', 'model to migrate').option('-t --type <type>', 'migration type').option('-v --version <version>', 'migration version number').types({
  string: ['m', 'model', 't', 'type', 'v', 'version']
}).action(async args => {
  try {
    await (0, _migrate2.default)(args);
    process.exit();
  } catch (error) {
    onError(error);
  }
});

vorpal.parse(process.argv);