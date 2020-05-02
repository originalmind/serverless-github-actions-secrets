const readPkg = require("read-pkg"),
  git = require("git-rev-sync");

module.exports = class PackageReader {
  constructor() {}

  getRepo() {
    var packageJSON = readPkg.sync();

    if (
      !packageJSON.repository ||
      packageJSON.repository.type !== "git" ||
      !packageJSON.repository.url
    ) {
      throw new Error("Unable to find repo git url");
    }

    var repo = new URL(packageJSON.repository.url.split("+")[1]).pathname.replace(
      ".git",
      ""
    );

    return repo;
  }

  /**
   * Get stage from stage mapping, depending on branch.
   */
  getStage() {
    var packageJSON = readPkg.sync();

    if (!packageJSON.om_sgas || !packageJSON.om_sgas.stage_mapping) {
      throw new Error("Unable to find stage mappings");
    }

    var branch = git.branch();

    var stage = packageJSON.om_sgas[branch];

    if (!stage) {
      throw new Error(`Unable to find stage for branch ${branch}`);
    }

    return stage;
  }
};
