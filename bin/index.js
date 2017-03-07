#! /usr/bin/env node
const Bluebird = require('bluebird');
const path = require('path');
const fs = require('fs');
const changeCase = require('change-case');
const generate = require('../src/commands/generate');
const vorpal = require('vorpal')();
const RStationAPI = require('@rstation/api').RStationAPI;

const rstationAPI = new RStationAPI({});

const onError = (error) => {
  vorpal.log(`[ERROR] ${error}`);
  if (error.stack) {
    console.error(error.stack);
  }
  process.exit();
};

vorpal
.command('generate [component] [title] [settings...]', 'Generates component')
.alias('g')
.action(args => generate(Bluebird, fs, path, changeCase, rstationAPI, args)
    .then(() => {
      process.exit();
    })
    .catch((error) => {
      onError(error);
    }));

vorpal.parse(process.argv);
