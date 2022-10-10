import React, { ReactNode, useContext, useEffect, useState } from 'react';

interface RuntimeValue {
  region: string;
  appInstanceArn: string;
  cognitoUserPoolId: string;
  cognitoUserPoolClientId: string;
}

const RuntimeContext = React.createContext<RuntimeValue | undefined>(undefined);

export function useRuntime(): RuntimeValue {
  const value = useContext(RuntimeContext);
  if (!value) {
    throw new Error('useAuth must be used within RuntimeProvider');
  }
  return value;
}

export default function RuntimeProvider({
  children,
}: {
  children: ReactNode;
}): JSX.Element {
  const [runtimeContext, setRuntimeContext] = useState<any>(undefined);

  useEffect(() => {
    fetch('/runtime-config.json')
      .then((response) => {
        return response.json();
      })
      .then((runtimeCtx) => {
        const cleanRuntimeContext = Object.values(runtimeCtx)[0] as any;
        if (
          cleanRuntimeContext.Region &&
          cleanRuntimeContext.AppInstanceArn &&
          cleanRuntimeContext.CognitoUserPoolId &&
          cleanRuntimeContext.CognitoUserPoolClientId
        ) {
          setRuntimeContext(cleanRuntimeContext);
        } else {
          console.warn(
            'runtime-config.json should have Region, AppInstanceArn, CognitoUserPoolId, CognitoUserPoolClientId.',
          );
        }
      })
      .catch(() => {
        console.log('No runtime-config.json detected');
        setRuntimeContext({});
      });
  }, []);

  if (runtimeContext) {
    const value: RuntimeValue = {
      region: runtimeContext.Region,
      appInstanceArn: runtimeContext.AppInstanceArn,
      cognitoUserPoolId: runtimeContext.CognitoUserPoolId,
      cognitoUserPoolClientId: runtimeContext.CognitoUserPoolClientId,
    };
    return (
      <RuntimeContext.Provider value={value}>
        {children}
      </RuntimeContext.Provider>
    );
  } else {
    return <></>;
  }
}
