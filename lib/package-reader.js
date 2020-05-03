const readPkg = require("read-pkg"),
  git = require("git-rev-sync"),
  util = require('util'),
  debuglog = util.debuglog('app');

module.exports = class PackageReader {

  packageJSON = null;

  constructor() {
    this.packageJSON = readPkg.sync();
  }

  getSection(section) {
    if (!this.packageJSON.om_sgas || !this.packageJSON.om_sgas[section]) {
      throw new Error(`Unable to find config section ${section}`);
    }

    return this.packageJSON.om_sgas[section];
  }

  getRepo() {
    
    if (
      !this.packageJSON.repository ||
      this.packageJSON.repository.type !== "git" ||
      !this.packageJSON.repository.url
    ) {
      throw new Error("Unable to find repo git url");
    }

    var repo = new URL(this.packageJSON.repository.url.split("+")[1]).pathname.replace(
      ".git",
      ""
    ).slice(1);

    return repo;
  }

  /**
   * Get stage from stage mapping, depending on branch.
   */
  getStage() {

    var stageMappings = this.getSection('stageMapping');

    var branch = git.branch();

    var stage = stageMappings[branch];

    if (!stage) {
      throw new Error(`Unable to find stage for branch ${branch}`);
    }

    return stage;
  }

  /**
   * Get config path
   */
  getConfigPath() {

    var configFile = this.getSection('configFile');

    return configFile['configPath'];

  }

  /**
   * Get config file pattern
   */
  getConfigFilePattern() {

    var configFile = this.getSection('configFile');

    return configFile['configFilePattern'];

  }
};
