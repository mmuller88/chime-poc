import { Authenticator } from '@aws-amplify/ui-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AppointmentList from './components/AppointmentList';
import AppointmentView from './components/AppointmentView';
import CreateAppointment from './components/CreateAppointment';
import DirectCall from './components/DirectCall';
import PickupRunner from './components/PickupRunner';
import WaitingRoom from './components/WaitingRoom';
import Widget from './components/Widget';
import './index.css';
import './localization';
import AuthProvider from './providers/AuthProvider';
import AwsClientProvider from './providers/AwsClientProvider';
import CallProvider from './providers/CallProvider';
import MessagingProvider from './providers/MessagingProvider';
import RouteProvider from './providers/RouteProvider';
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
                  <Widget title="Original" number={1}>
                    <RouteProvider
                      routes={{
                        AppointmentList: <AppointmentList />,
                        AppointmentView: <AppointmentView />,
                        DirectCall: <DirectCall />,
                        CreateAppointment: <CreateAppointment />,
                        WaitingRoom: <WaitingRoom />,
                      }}
                    />
                    \{' '}
                  </Widget>
                  <Widget title="Direct Call" number={2}>
                    <DirectCall />
                  </Widget>
                  <Widget title="Pickup Runner" number={3}>
                    <PickupRunner />
                  </Widget>
                  <Widget title="Waiting Room" number={4}>
                    <MessagingProvider>
                      <WaitingRoom />
                    </MessagingProvider>
                  </Widget>
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
