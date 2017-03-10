module.exports = (Bluebird, fs, path, changeCase, rstationAPI, options) => {
  const getControllerFileSettings = (controllersDir, controllerTitle) => {
    const titlePts = controllerTitle.split('/');
    const title = titlePts.splice(-1, 1);
    let controllerDir = controllersDir;
    titlePts.forEach((namespace) => {
      controllerDir = path.join(controllerDir, namespace);
      if (!fs.existsSync(controllerDir)) fs.mkdirSync(controllerDir);
    });
    return { title, controllerDir };
  };
  if (options.component === 'model') {
    const modelsDir = path.join(process.cwd(), 'models');
    if (!fs.existsSync(modelsDir)) return Bluebird.reject('\'models\' folder doesn\'t exist');
    if (!options.title) return Bluebird.reject('model title wasn\'t specified');
    let modelStr = 'module.exports = (Sequelize) => ({';
    if (options.settings && options.settings.length > 0) {
      options.settings.sort().forEach((field) => {
        const fieldPts = field.split(':');
        const title = fieldPts[0];
        const type = fieldPts[1];
        const fieldName = changeCase.snake(title);
        modelStr += `
  ${title}: {
    type: Sequelize.${type.toUpperCase()},`;
        if (fieldName.indexOf('_') > -1) {
          modelStr += `
    field: '${fieldName}',`;
        }
        modelStr += `
  },`;
      });
    }
    modelStr += `
});`;
    const modelDir = path.join(modelsDir, changeCase.param(options.title));
    if (!fs.existsSync(modelDir)) fs.mkdirSync(modelDir);
    fs.writeFileSync(path.join(modelDir, 'model.js'), modelStr);
  }
  if (options.component === 'controller') {
    const controllersDir = path.join(process.cwd(), 'controllers');
    if (!fs.existsSync(controllersDir)) return Bluebird.reject('\'controllers\' folder doesn\'t exist');
    if (!options.title) return Bluebird.reject('controller title wasn\'t specified');
    let controllerStr = 'module.exports = (Bluebird) => ({';
    if (options.settings && options.settings.length > 0) {
      options.settings.sort().forEach((action) => {
        controllerStr += `
  ${action}: {
    //schema: ,
    method(ctx) {
      ctx.body = {};
      return Bluebird.resolve();
    },
  },`;
      });
    }
    controllerStr += `
});`;
    const fileSettings = getControllerFileSettings(controllersDir, options.title);
    fs.writeFileSync(path.join(fileSettings.controllerDir, `${fileSettings.title}.js`), controllerStr);
  }
  if (options.component === 'crud') {
    return rstationAPI.loadModels().then(() => {
      const controllersDir = path.join(process.cwd(), 'controllers');
      if (!fs.existsSync(controllersDir)) return Bluebird.reject('\'controllers\' folder doesn\'t exist');
      const container = rstationAPI.bottle.container;
      if (!options.title) return Bluebird.reject('crud model wasn\'t specified');
      const fileSettings = getControllerFileSettings(controllersDir, options.title);
      const modelName = changeCase.pascal(fileSettings.title);
      const model = container[modelName];
      const attributes = Object.keys(model.rawAttributes).filter(attribute => attribute.indexOf('_') === -1 && attribute !== 'id');
      // TODO: map field types
      const fieldsSchema = `r-${fileSettings.title}:${attributes.map(attribute => `r-${attribute}:`)},`;
      const methods = {
        create() {
          return `
  create: {
    schema: new JSchema('r-data:${fieldsSchema};;').schema,
    method(ctx) {
      return ${modelName}
        .create(ctx.${fileSettings.title}).then(() => {
          ctx.body = {};
        });
    },
  },`;
        },
        delete() {
          return `
  delete: {
    schema: new JSchema('r-data:r-${fileSettings.title}:r-id:number,;;').schema,
    method(ctx) {
      return ${modelName}
        .destroy({
          where: {
            id: ctx.${fileSettings.title}.id,
          },
        }).then(() => {
          ctx.body = {};
        });
    },
  },`;
        },
        index() {
          return `
  index: {
    method(ctx) {
      return ${modelName}
        .findAll()
        .then((found${modelName}s) => {
          ctx.body = {
            data: {
              ${fileSettings.title}s: found${modelName}s.map(found${modelName} => ({${['id'].concat(attributes).map(attribute => `
                ${attribute}: found${modelName}.${attribute}`)},
              })),
            },
          };
        });
    },
  },`;
        },
        show() {
          return `
  show: {
    schema: new JSchema('r-data:r-${fileSettings.title}:r-id:number,;;').schema,
    method(ctx) {
      return ${modelName}
        .findOne({
          where: {
            id: ctx.${fileSettings.title}.id,
          }
        })
        .then((found${modelName}) => {
          ctx.body = {
            data: {
              ${fileSettings.title}: {${['id'].concat(attributes).map(attribute => `
                ${attribute}: found${modelName}.${attribute}`)},
              },
            },
          };
        });
    },
  },`;
        },
        update() {
          return `
  update: {
    schema: new JSchema('r-data:${fieldsSchema}r-id:number,;;').schema,
    method(ctx) {
      const data = Object.assign({}, ctx.${fileSettings.title});
      delete data.id;
      return ${modelName}
        .update(data, {
          where: {
            id: ctx.${fileSettings.title}.id,
          },
        })
        .then(() => {
          ctx.body = {};
        });
    },
  },`;
        },
      };
      let controllerStr = `module.exports = (Bluebird, JSchema, ${modelName}) => ({`;
      controllerStr += `
  before(ctx) {
    if (ctx.request.fields && ctx.request.fields.data && ctx.request.fields.data.${fileSettings.title}) {
      ctx.${fileSettings.title} = ctx.request.fields.data.${fileSettings.title};
    }
    return Bluebird.resolve();
  },`;
      const methodsToGenerate = options.settings && options.settings.length > 0 ? options.settings : Object.keys(methods);
      methodsToGenerate.forEach((method) => {
        controllerStr += methods[method]();
      });
      controllerStr += `
});`;
      fs.writeFileSync(path.join(fileSettings.controllerDir, `${fileSettings.title}.js`), controllerStr);
      return Bluebird.resolve();
    });
  }
  if (options.component === 'secret') {
    const rcPath = path.join(process.cwd(), '.apirc.js');
    if (fs.existsSync(rcPath)) {
      const rc = require(rcPath);
      if (rc.secret) {
        Object.keys(rc.secret).forEach((env) => {
          let configPath = path.join(process.cwd(), 'config');
          let config = {};
          configPath = `${configPath}/${env === 'common' ? '' : `${env}/`}secret.js`;
          if (fs.existsSync(configPath)) config = require(configPath);
          const keys = Object.keys(config);
          const nextKeys = rc.secret[env];
          nextKeys.forEach((item) => {
            if (!keys.includes(item)) keys.push(item);
          });
          let str = `module.exports = {`;
          keys.sort().forEach((item) => {
            const value = config[item];
            str += `
  ${item}: ${value ? `${typeof value === 'string' ? `'${value}'` : value}` : `''`},`;
          });
          str += `
}`;
          fs.writeFileSync(configPath, str);
        });
      }
    }
  }
  return Bluebird.resolve();
};
