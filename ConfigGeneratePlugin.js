const fs = require('fs');
const path = require('path');

const generateValue = (str) => new Function(`return ${str}`)();

// 业务配置生成插件
class ConfigGeneratePlugin {
  options = []

  defaultOptions = {
    templatePath: './businessConfigTemplate.json',
    filename: 'business.config.js',
    path: 'public',
    name: '__BUSINESS__CONF__',
  };

  constructor(rawOptions) {
    const options = Array.isArray(rawOptions)
      ? rawOptions
      : [rawOptions ? rawOptions : this.defaultOptions];
    if (!options.length) {
      options[0] = this.defaultOptions;
    } else if (
      !options.every((option) => option && option.templatePath && option.filename && option.name)
    ) {
      throw new Error('ConfigGeneratePlugin configuration error!');
    } else {
      this.options = (options || [this.defaultOptions]).map((option) => ({
        ...this.defaultOptions,
        ...option,
      }));
    }
  }

  generateConfig(option) {
    const businessConfigTemplate = require(path.resolve(process.cwd(), option.templatePath));
    let template = `window['${option.name}'] = {`;
    for (let moduleKey in businessConfigTemplate) {
      const moduleItem = businessConfigTemplate[moduleKey];
      template += `${JSON.stringify(moduleKey)}:{`;
      for (let configKey in moduleItem) {
        const configItem = moduleItem[configKey];
        template += `/* ${configItem.description} */`;
        template += `${JSON.stringify(configKey)}: ${JSON.stringify(
          generateValue(configItem.value),
        )},`;
      }
      template += `},`;
    }
    template += `};Object.freeze(window['${option.name}']);Object.defineProperty(window, "${option.name}", {configurable: false,writable: false});`;
    fs.writeFileSync(path.resolve(process.cwd(), option.path, option.filename), template);
  }

  apply(compiler) {
    compiler.hooks.afterEnvironment.tap('ConfigGeneratePlugin', () => {
      this.options.forEach((option) => this.generateConfig(option));
    });
  }
}

module.exports = ConfigGeneratePlugin;
