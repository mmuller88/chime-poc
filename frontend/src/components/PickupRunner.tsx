import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { AccountType } from '../constants';

import { useAuth } from '../providers/AuthProvider';
import { useCall } from '../providers/CallProvider';
import './AppointmentList.css';

dayjs.extend(calendar);
dayjs.extend(localizedFormat);

// const REFRESH_INTERVAL = 1000;

export default function PickupRunner(): JSX.Element {
  const { accountType } = useAuth();
  const { CallView } = useCall();

  console.log(accountType);

  return (
    <div className="AppointmentList">
      <CallView isCaller={accountType === AccountType.Doctor} />
    </div>
  );
}
