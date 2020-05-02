# serverless-github-actions-secrets

Manage Serveless Framework config values in GitHub Actions Secrets

## Usage

1. Add a script entry to your package.json:
   ```
   "scripts: {
     "secrets": "github-secrets"
   }
   ```
2. Manual use:
   ```
   export GITHUB_ACCESS_TOKEN=...
   npm run secrets -- --stage dev
   ```

   or token and repo can be supplied:

   ```
   npm run secrets -- --stage dev --token my_github_token --repo owner/repo-name
   ```

### Usage with git hook

Since you're using Github Actions, it's a good idea to push the secrets before pushing your code. This can be automated using git hooks.

Since we can't specify a stage, we must map it from the current branch. This is specified in the package.json. This package will read this metadata if the `--stage` option is not specified.

1. `npm i husky --save-dev`
2. Add required metadata to package.json:
   ```
	"husky": {
		"hooks": {
		  "pre-push": "github-secrets",
		}
	},
	"om_sgas": {
      "stage_mapping": {
		"develop": "dev",
        "master": "prod"
      }
    },
   ```

   More info about [Husky](https://github.com/typicode/husky).

## Debugging

```
NODE_DEBUG=app npm run dev
```