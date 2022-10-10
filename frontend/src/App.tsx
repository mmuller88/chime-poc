import { Authenticator } from '@aws-amplify/ui-react';

import AppointmentList from './components/AppointmentList';
import AppointmentView from './components/AppointmentView';
import CreateAppointment from './components/CreateAppointment';
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
      <Widget>
        <RuntimeProvider>
          <AuthProvider>
            {/*
             * AuthProvider shows the sign-in page for non-authenticated users and
             * the following children for authenticated users.
             */}
            <AwsClientProvider>
              <MessagingProvider>
                <RouteProvider
                  routes={{
                    AppointmentList: <AppointmentList />,
                    AppointmentView: <AppointmentView />,
                    CreateAppointment: <CreateAppointment />,
                  }}
                />
              </MessagingProvider>
            </AwsClientProvider>
          </AuthProvider>
        </RuntimeProvider>
      </Widget>
    </Authenticator.Provider>
  );
}

export default App;
