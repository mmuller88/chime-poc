import { ChimeSDKIdentityClient } from '@aws-sdk/client-chime-sdk-identity';
import { ChimeSDKMessagingClient } from '@aws-sdk/client-chime-sdk-messaging';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { SFNClient } from '@aws-sdk/client-sfn';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-providers';
import React, { ReactNode, useContext } from 'react';

import { useAuth } from './AuthProvider';
import { useRuntime } from './RuntimeProvider';

interface AwsClientValue {
  cognitoClient: CognitoIdentityProviderClient;
  identityClient: ChimeSDKIdentityClient;
  messagingClient: ChimeSDKMessagingClient;
  lambdaClient: LambdaClient;
  sfnClient: SFNClient;
}

const AwsClientContext = React.createContext<AwsClientValue | undefined>(
  undefined,
);

export function useAwsClient(): AwsClientValue {
  const value = useContext(AwsClientContext);
  if (!value) {
    throw new Error('AwsClient must be used within AwsClientProvider');
  }
  return value;
}

export default function AwsClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { region, cognitoUserPoolId, cognitoIdentityPoolId } = useRuntime();
  const { getIdToken } = useAuth();
  const parameters = {
    region: region,
    credentials: fromCognitoIdentityPool({
      clientConfig: { region: region },
      identityPoolId: cognitoIdentityPoolId,
      logins: {
        [`cognito-idp.${region}.amazonaws.com/${cognitoUserPoolId}`]:
          getIdToken,
      },
    }),
  };
  const value = {
    cognitoClient: new CognitoIdentityProviderClient(parameters),
    identityClient: new ChimeSDKIdentityClient(parameters),
    messagingClient: new ChimeSDKMessagingClient(parameters),
    lambdaClient: new LambdaClient(parameters),
    sfnClient: new SFNClient(parameters),
  };
  return (
    <AwsClientContext.Provider value={value}>
      {children}
    </AwsClientContext.Provider>
  );
}
