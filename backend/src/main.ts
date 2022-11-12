import { App } from 'aws-cdk-lib';
import { CdkStack } from './cdk-stack';

// for development, use account/region from cdk cli
const devEnv = {
  account: '981237193288',
  region: 'eu-central-1',
};

const app = new App();

new CdkStack(app, 'AmazonChimeSdkTelehealthWidgetDemo', { env: devEnv });
// new MyStack(app, 'backend-prod', { env: prodEnv });

app.synth();
