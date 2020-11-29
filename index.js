const fs = require("fs"),
  yaml = require("yaml"),
  ini = require("ini"),
  cla = require("command-line-args"),
  github = require("./lib/github"),
  packageReader = require("./lib/package-reader"),
  util = require('util'),
  debuglog = util.debuglog('app'),
  path = require('path');

const optionDefinitions = [
  {
    name: "token",
    alias: "t",
    type: String,
    description: "GitHub OAuth2 token",
  },
  {
    name: "repo",
    alias: "r",
    type: String,
    description: 'GitHub repo path as "owner/repo"',
  },
  {
    name: "stage",
    alias: "s",
    type: String,
    description: "Deployment stage, e.g. dev, staging, prod",
  },
  {
    name: "configPath",
    alias: "c",
    type: String,
    description: "Path to serverless config file"
  },
  {
    name: "configFilePattern",
    alias: "f",
    type: String,
    description: "Match pattern for serverless config file containing values to write to GitHub Actions Secrets. Replace tokens supported: {stage}"
  },
  {
    name: "noConfigFile",
    type: Boolean,
    description: "If true, config file is ignored"
  },
  {
    name: "prefixWithStage",
    alias: "w",
    type: Boolean,
    description: "If true, secret names will be prefixed by {stage}{separator}"
  },
  {
    name: "prefixSeparator",
    alias: "e",
    type: String,
    description: "Separator between prefix and secret name"
  },
  {
    name: "operation",
    alias: "o",
    type: String,
    description: "One of: write, writeOne, list, get, cred",
    default: "write",
  },
  {
    name: "secretName",
    alias: "n",
    type: String,
    description: "GitHub secret name (for writeOne)",
  },
  {
    name: "secretValue",
    type: String,
    description: "GitHub secret value (for writeOne)",
  },
  {
    name: "awsProfileName",
    alias: "p",
    type: String,
    description: "AWS profile name from credentials file",
  },
];

var configFile = '';

const options = cla(optionDefinitions);
const pkg = new packageReader();

if (!options.token) {
  if (!process.env.GITHUB_ACCESS_TOKEN) {
    throw new Error("Token must be specified");
  }
  options.token = process.env.GITHUB_ACCESS_TOKEN;
}

if (!options.repo) {
  options.repo = pkg.getRepo();
}

if (!options.stage) {
  try {
    options.stage = pkg.getStage();
  } catch (e) {
    console.log(e);
    options.stage = null;
    console.log("Stage not available - exiting...");
    process.exit();
  }
}

if (!options.noConfigFile && !options.configPath) {
  options.configPath = pkg.getConfigPath();
}

if (!options.noConfigFile && !options.configFilePattern) {
  options.configFilePattern = pkg.getConfigFilePattern();
}

if (!options.prefixWithStage) {
  options.prefixWithStage = pkg.getPrefixWithStage();
}

if (!options.prefixSeparator) {
  options.prefixSeparator = pkg.getPrefixSeparator();
}

var prefix = '';
if (options.prefixSeparator) {
  prefix = `${options.stage}${options.prefixSeparator}`;
}

// Resolve config file if options allow
if (!options.noConfigFile) {
  configFile = path.resolve(
    options.configPath,
    options.configFilePattern.replace('{stage}', options.stage)
  );
}

var tokenRedacted = options.token.replace(/(\w{5})\w+/, '$1xxxxxxxxxx');

debuglog(`Running with options: ${tokenRedacted} ${options.repo} ${options.stage} ${options.noConfigFile} ${configFile}`);

const gitHubAPI = new github({
  token: options.token,
  repoPath: options.repo,
  prefix: prefix
});


switch (options.operation) {
  case "write": {
    console.log("Reading " + configFile);

    const configDoc = yaml.parse(fs.readFileSync(configFile, "utf8"));

    Object.keys(configDoc).forEach((configKey) => {
      gitHubAPI.writeToGitHub(configKey, configDoc[configKey]);
    });

    break;
  }
  case "writeOne": {
    gitHubAPI.writeToGitHub(options.secretName, options.secretValue);

    break;
  }
  case "cred": {
    if (!options.awsProfileName) {
      console.error(
        'AWS profile name must be specified for operation type "cred"'
      );
      process.exit();
    }

    const configFile = `${process.env.HOME}/.aws/credentials`;
    console.log("Reading " + configFile);

    const configDoc = ini.parse(fs.readFileSync(configFile, "utf8"));

    gitHubAPI.writeToGitHub(
      "AWS_ACCESS_KEY_ID",
      configDoc[options.awsProfileName].aws_access_key_id
    );
    gitHubAPI.writeToGitHub(
      "AWS_SECRET_ACCESS_KEY",
      configDoc[options.awsProfileName].aws_secret_access_key
    );

    break;
  }
  case "list": {
    gitHubAPI.listSecrets();
    break;
  }
  case "get": {
    if (!options.secretName) {
      console.error('Secret name must be specified for operation type "get"');
      process.exit();
    }
    gitHubAPI.getSecret(options.secretName);
    break;
  }
  case "delete": {
    if (!options.secretName) {
      console.error('Secret name must be specified for operation type "delete"');
      process.exit();
    }
    gitHubAPI.deleteSecret(options.secretName);
    break;
  }
  case "connect": {
    gitHubAPI.connect();
    break;
  }
  default: {
    console.log("No operation specified");
    break;
  }
}
