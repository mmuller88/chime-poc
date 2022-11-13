import { AccountType } from '../constants';
import { useAuth } from '../providers/AuthProvider';
import MessagingProvider from '../providers/MessagingProvider';
import RouteProvider from '../providers/RouteProvider';
import AppointmentList from './AppointmentList';
import AppointmentView from './AppointmentView';
import CreateAppointment from './CreateAppointment';
import DirectCall from './DirectCall';
import WaitingRoom from './WaitingRoom';
import Widget from './Widget';

export default function Widgets(): JSX.Element {
  const { accountType } = useAuth();

  return (
    <div>
      {accountType === AccountType.Doctor && (
        <Widget title="Original" number={2}>
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
      )}
      <Widget title="Waiting Room" number={1}>
        <MessagingProvider>
          <WaitingRoom />
        </MessagingProvider>
      </Widget>
    </div>
  );
}
