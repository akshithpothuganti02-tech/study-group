/**
 * AWS Amplify Configuration
 * Replace the placeholder values below with your actual AWS resource details
 * after completing the AWS Console setup steps in the deployment guide.
 */
const awsConfig = {
  Auth: {
    Cognito: {
      // Get these from: AWS Console → Cognito → User Pools → Your Pool
      userPoolId: 'YOUR_USER_POOL_ID',           // e.g. eu-west-1_xxxxxxxxx
      userPoolClientId: 'YOUR_APP_CLIENT_ID',     // e.g. 1234567890abcdefghij
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
      },
    },
  },
  Storage: {
    S3: {
      bucket: 'YOUR_S3_BUCKET_NAME',             // e.g. studysync-materials
      region: 'YOUR_AWS_REGION',                  // e.g. eu-west-1
    },
  },
};

export default awsConfig;
