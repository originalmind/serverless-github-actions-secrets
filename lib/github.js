const sodium = require('tweetsodium'),
  axios = require('axios');

module.exports = class GitHubAPI {
  repoPath = null;
  publicKey = null;
  prefix = '';

  constructor(options) {
    this.repoPath = options.repoPath;
    this.prefix = options.prefix;
    this.axios = axios.create({
      baseURL: 'https://api.github.com/',
      headers: {
        common: {
          Authorization: `token ${options.token}`,
        },
      },
    });
  }

  getSecretName(secretName) {
    if (this.prefix) {
      secretName = this.prefix + secretName;
    }

    return secretName;
  }

  /**
   * Get public key used for encryption.
   * 
   */
  async getPublicKey() {
    if (this.publicKey) {
      // console.log('already got key');
      return new Promise((resolve) => {
        resolve(this.publicKey);
      });
    }

    console.log(
      'Calling ' + `/repos/${this.repoPath}/actions/secrets/public-key`,
    );

    const response = await this.axios
      .get(`/repos/${this.repoPath}/actions/secrets/public-key`)
      .then((response) => {
        if (response.status === 200) {
          this.publicKey = response.data;
          // console.log(this.publicKey);
        } else {
          console.log(response.status);
        }
      })
      .catch((error) => {
        console.log(error.response.status);
      });

    return new Promise((resolve) => {
      resolve(this.publicKey);
    });
  }

  /**
   * Check connectivity
   */
  async connect() {
    this.axios
    .get(`/repos/${this.repoPath}`)
    .then((response) => {
      console.log(response.data);
    })
    .catch((error) => {
      console.log(error.response.status);
    }); 
  }

  /**
   * List this repo's secrets
   */
  async listSecrets(filterByPrefix = false) {
    this.axios
      .get(`/repos/${this.repoPath}/actions/secrets`)
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.log(error.response.status);
      });
  }

  /**
   * Get a specific secret by name
   * 
   * @param {string} secretName 
   */
  async getSecret(secretName) {

    secretName = this.getSecretName(secretName);    
    
    this.axios
      .get(`/repos/${this.repoPath}/actions/secrets/${secretName}`)
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.log(error.response.status);
      });
  }

  /**
   * Encrypt and write a secret to GitHub
   * 
   * @param {string} secretName 
   * @param {string} value 
   */
  async writeToGitHub(secretName, value) {
    // Convert the message and key to Uint8Array's (Buffer implements that interface)
    const messageBytes = Buffer.from(value.toString());
    let pubKey = await this.getPublicKey();
    // console.log(pubKey);
    const keyBytes = Buffer.from(pubKey.key, 'base64');

    // Encrypt using LibSodium.
    const encryptedBytes = sodium.seal(messageBytes, keyBytes);

    // Base64 the encrypted secret
    const encrypted = Buffer.from(encryptedBytes).toString('base64');

    secretName = this.getSecretName(secretName);    

    console.log('Writing ' + encrypted + ' to secret ' + secretName);

    this.axios
      .put(
        '/repos/' + this.repoPath + '/actions/secrets/' + encodeURI(secretName),
        {
          encrypted_value: encrypted,
          key_id: pubKey.key_id,
        },
      )
      .then((response) => {
        console.log('Secret written');
      })
      .catch((error) => console.log(error.response.status)); // console.log(error));
  }
};
