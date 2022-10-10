import { Authenticator } from '@aws-amplify/ui-react';
import React from 'react';
import ReactDOM from 'react-dom';

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
import configureAmplify from './utils/configureAmplify';

declare global {
  interface Window {
    initAmazonChimeSDKWidget: (
      container: Element | Document | DocumentFragment,
    ) => void;
  }
}

window.initAmazonChimeSDKWidget = (
  container?: Element | Document | DocumentFragment,
): void => {
  configureAmplify();
  if (!container) {
    container = document.createElement('div');
    container.id = 'amazon-chime-sdk-widget-container';
    document.body.appendChild(container);
  }
  ReactDOM.render(
    <React.StrictMode>
      <Authenticator.Provider>
        <Widget>
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
        </Widget>
      </Authenticator.Provider>
    </React.StrictMode>,
    container,
  );
};
