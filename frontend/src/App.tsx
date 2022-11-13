import { Authenticator } from '@aws-amplify/ui-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Widgets from './components/Widgets';
import './index.css';
import './localization';
import AuthProvider from './providers/AuthProvider';
import AwsClientProvider from './providers/AwsClientProvider';
import CallProvider from './providers/CallProvider';
import MessagingProvider from './providers/MessagingProvider';
import RuntimeProvider from './providers/RuntimeProvider';

const queryClient = new QueryClient();

/**
 * Return the routes for the application.
 * @returns {JSX.Element} App component
 */
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Authenticator.Provider>
        <RuntimeProvider>
          <AuthProvider>
            <AwsClientProvider>
              <MessagingProvider>
                <CallProvider>
                  <Widgets />
                </CallProvider>
              </MessagingProvider>
            </AwsClientProvider>
          </AuthProvider>
        </RuntimeProvider>
      </Authenticator.Provider>
    </QueryClientProvider>
  );
}

export default App;
