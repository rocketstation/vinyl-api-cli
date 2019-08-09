'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _rocketstationApi = require('rocketstation-api');

const migrate = async ({ options: { model, type = 'up', version } }) => {
  const { bottle, run, runPending } = await (0, _rocketstationApi.loadMigrations)();

  const { container: { db, pgp } } = bottle;

  const connection = db.getConnection(pgp, `${db.connectionString}/${db.name}`);

  if (!model) await runPending(connection);else await run(connection, type, model, version);

  pgp.end();
};

exports.default = migrate;