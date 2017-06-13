'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _rocketstationApi = require('rocketstation-api');

const seed = async () => {
  const { seed } = await (0, _rocketstationApi.loadMigrations)();
  return seed();
};

exports.default = seed;