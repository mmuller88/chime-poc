import { Authenticator } from '@aws-amplify/ui-react';

import AppointmentList from './components/AppointmentList';
import AppointmentView from './components/AppointmentView';
import CreateAppointment from './components/CreateAppointment';
import DirectCall from './components/DirectCall';
import Widget from './components/Widget';
import './index.css';
import './localization';
import AuthProvider from './providers/AuthProvider';
import AwsClientProvider from './providers/AwsClientProvider';
import MessagingProvider from './providers/MessagingProvider';
import RouteProvider from './providers/RouteProvider';
import RuntimeProvider from './providers/RuntimeProvider';

/**
 * Return the routes for the application.
 * @returns {JSX.Element} App component
 */
function App() {
  return (
    <Authenticator.Provider>
      <RuntimeProvider>
        <AuthProvider>
          <AwsClientProvider>
            <Widget number={1}>
              <MessagingProvider>
                <RouteProvider
                  routes={{
                    AppointmentList: <AppointmentList />,
                    AppointmentView: <AppointmentView />,
                    DirectCall: <DirectCall />,
                    CreateAppointment: <CreateAppointment />,
                  }}
                />
              </MessagingProvider>
            </Widget>
            <Widget number={2}>
              <MessagingProvider>
                <RouteProvider
                  routes={{
                    AppointmentList: <AppointmentList />,
                    AppointmentView: <AppointmentView />,
                    DirectCall: <DirectCall />,

                    CreateAppointment: <CreateAppointment />,
                  }}
                  defaultRoute={<DirectCall />}
                />
              </MessagingProvider>
            </Widget>
          </AwsClientProvider>
        </AuthProvider>
      </RuntimeProvider>
    </Authenticator.Provider>
  );
}

export default App;
