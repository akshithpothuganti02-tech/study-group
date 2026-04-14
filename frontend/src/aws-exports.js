/**
 * AWS Amplify Configuration
 * All values are injected from environment variables at build time.
 * On EC2: set these in /etc/environment BEFORE running deploy_ec2.sh
 * For local dev: create frontend/.env and add the VITE_ prefixed variables.
 *
 * Required variables:
 *   VITE_COGNITO_USER_POOL_ID  - e.g. eu-west-1_xxxxxxxxx
 *   VITE_COGNITO_CLIENT_ID     - e.g. 1234567890abcdefghij
 *   VITE_AWS_REGION            - e.g. eu-west-1
 *   VITE_S3_BUCKET             - e.g. studysync-materials-yourname
 */
const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      },
    },
  },
  Storage: {
    S3: {
      bucket: import.meta.env.VITE_S3_BUCKET,
      region: import.meta.env.VITE_AWS_REGION || 'eu-west-1',
    },
  },
};

export default awsConfig;
