const fs = require('fs'),
  yaml = require('yaml'),
  ini = require('ini'),
  cla = require('command-line-args'),
  github = require('./lib/github');

const optionDefinitions = [
  {
    name: 'token',
    alias: 't',
    type: String,
    description: 'GitHub OAuth2 token',
  },
  {
    name: 'repo',
    alias: 'r',
    type: String,
    description: 'GitHub repo path as "owner/repo"',
  },
  {
    name: 'stage',
    alias: 's',
    type: String,
    description: 'Deployment stage, e.g. dev, staging, prod',
  },
  {
    name: 'operation',
    alias: 'o',
    type: String,
    description: 'One of: write, list, get, cred',
    default: 'write',
  },
  {
    name: 'secretName',
    alias: 'n',
    type: String,
    description: 'GitHub secret name',
  },
  {
    name: 'awsProfileName',
    alias: 'p',
    type: String,
    description: 'AWS profile name from credentials file',
  },
];
const options = cla(optionDefinitions);

if (!options.token) {
  console.error('Token must be specified');
  process.exit();
}

if (!options.repo) {
  console.error('Repo path must be specified');
  process.exit();
}

if (!options.stage) {
  console.error('Stage must be specified');
  process.exit();
}

const gitHubAPI = new github(options.token, options.repo);

switch (options.operation) {
  case 'write': {
    const configFile = `../../sls/config/config.${options.stage}.secret.yml`;
    console.log('Reading ' + configFile);

    const configDoc = yaml.parse(fs.readFileSync(configFile, 'utf8'));

    Object.keys(configDoc).forEach((configKey) => {
      gitHubAPI.writeToGitHub(configKey, configDoc[configKey]);
    });

    break;
  }
  case 'cred': {
    if (!options.awsProfileName) {
      console.error(
        'AWS profile name must be specified for operation type "cred"',
      );
      process.exit();
    }

    const configFile = `${process.env.HOME}/.aws/credentials`;
    console.log('Reading ' + configFile);

    const configDoc = ini.parse(fs.readFileSync(configFile, 'utf8'));

    gitHubAPI.writeToGitHub(
      'AWS_ACCESS_KEY_ID',
      configDoc[options.awsProfileName].aws_access_key_id,
    );
    gitHubAPI.writeToGitHub(
      'AWS_SECRET_ACCESS_KEY',
      configDoc[options.awsProfileName].aws_secret_access_key,
    );

    break;
  }
  case 'list': {
    gitHubAPI.listSecrets();
    break;
  }
  case 'get': {
    if (!options.secretName) {
      console.error('Secret name must be specified for operation type "get"');
      process.exit();
    }
    gitHubAPI.getSecret(options.secretName);
    break;
  }
  default: {
    console.log('No operation specified');
    break;
  }
}
