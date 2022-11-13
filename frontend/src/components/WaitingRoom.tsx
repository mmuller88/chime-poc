import { AccountType } from '../constants';
import { useAuth } from '../providers/AuthProvider';
import { useCall } from '../providers/CallProvider';
import WaitingRoomClientView from './WaitingRoomClientView';
import WaitingRoomInterpreterView from './WaitingRoomInterpreterView';

export default function WaitingRoom(): JSX.Element {
  const { accountType } = useAuth();
  const { CallView } = useCall();

  return (
    <div>
      {accountType === AccountType.Doctor && <WaitingRoomInterpreterView />}
      {accountType === AccountType.Patient && <WaitingRoomClientView />}
      <CallView isCaller={accountType === AccountType.Doctor} />
    </div>
  );
}
