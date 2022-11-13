import { AccountType } from '../constants';
import { useAuth } from '../providers/AuthProvider';
import WaitingRoomInterpreterView from './WaitingRoomInterpreterView';
import WaitingRoomOperatorView from './WaitingRoomOperatorView';

export default function WaitingRoom(): JSX.Element {
  const { accountType } = useAuth();

  return (
    <div>
      {accountType === AccountType.Doctor && <WaitingRoomInterpreterView />}
      {accountType === AccountType.Patient && <WaitingRoomOperatorView />}
    </div>
  );
}
