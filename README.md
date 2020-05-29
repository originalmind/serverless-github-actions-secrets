# serverless-github-actions-secrets

Manage Serveless Framework config values in GitHub Actions Secrets

## Basic Usage - Writing Secrets to GitHub Actions

1. Add a script entry to your package.json:

   ```
   "scripts: {
     "secrets": "github-secrets"
   }
   ```
2. Write secrets from Serverless config file using default options:

   ```
   export GITHUB_ACCESS_TOKEN=...
   npm run secrets
   ```
   
### All options

   There are a number of options for configuring the write operation. All options can be set on the command line or in package.json for automated usage.

   ```
   npm run secrets -- --stage dev --token my_github_token --repo owner/repo-name --configPath "path/to/config/directory/" --configFilePattern "config.{stage}.secret.yml" --prefixWithStage true --prefixSeparator "_"
   ```

### Usage with git hook

Since you're using Github Actions, it's a good idea to push the secrets before pushing your code. This can be automated using git hooks.

Since we can't specify a stage, we must map it from the current branch. This is specified in the package.json. This package will read this metadata if the `--stage` option is not specified.

If the branch cannot be mapped, an error will be output and the hook action will not continue.

You must also specify where your config file is by setting this in the package.json as shown below.

1. `npm i husky --save-dev`
2. Add required metadata to package.json:
   ```
    "husky": {
      "hooks": {
        "pre-push": "npm run secrets -- --operation write"
      }
    },
    "om_sgas": {
      "secretNaming": {
        "prefixWithStage": false,
        "prefixSeparator": "_"
      },
      "configFile": {
        "configPath": "./config",
        "configFilePattern": "config.{stage}.secret.yml"
      },
      "stage_mapping": {
        "develop": "dev",
        "master": "prod"
      }
    },
   ```

   More info about [Husky](https://github.com/typicode/husky).

## Extended Usage

This package also allows the following interactions with GitHub Actions Secrets:

### List Secrets

```
npm run secrets -- --operation list
```

### Get a secret

```
npm run secrets -- --operation get --secretName topsecret
```

### Add AWS Credentials

This is useful (required!) when using GitHub Actions to perform deployment to AWS (unless you are using self-hosted runners - https://github.com/marketplace/actions/configure-aws-credentials-action-for-github-actions#self-hosted-runners).

You specify the name of a profile in your `~/.aws/credentials` file. This package will read the keys from the file and set them as GitHub Actions secrets with the names `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. If the `prefixWithStage` option is true, then they'll be written with names `<stage><prefix-separator>AWS_ACCESS_KEY_ID` and `<stage><prefix-separator>AWS_SECRET_ACCESS_KEY`.

```
npm run secrets -- --operation cred --awsProfileName my-profile
```

## Debugging

```
NODE_DEBUG=app npm run dev
```
