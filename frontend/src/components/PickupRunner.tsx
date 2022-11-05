import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { useCallback } from 'react';
import { AccountType } from '../constants';

import { useAuth } from '../providers/AuthProvider';
import { useCall } from '../providers/CallProvider';
// import { useRoute } from '../providers/RouteProvider';
import './AppointmentList.css';
import MeetingDoctorView from './MeetingDoctorView2';
import MeetingPatientView from './MeetingPatientView2';

dayjs.extend(calendar);
dayjs.extend(localizedFormat);

// const REFRESH_INTERVAL = 1000;

export default function PickupRunner(): JSX.Element {
  // const { messagingClient } = useAwsClient();
  const { accountType } = useAuth();
  // const { setRoute } = useRoute();
  const { callChannel, meetingId } = useCall();

  console.log(accountType);

  // const { messagingSession } = useMessaging();
  // const mountedRef = useMountedRef();
  // const { t } = useTranslation();

  // const getChannel = useCallback(
  //   async (channelArn: string) => {
  //     (async () => {
  //       try {
  //         console.log('getChannel');

  //         const data: DescribeChannelModeratedByAppInstanceUserCommandOutput =
  //           await messagingClient.send(
  //             new DescribeChannelModeratedByAppInstanceUserCommand({
  //               ChimeBearer: appInstanceUserArn,
  //               ChannelArn: channelArn,
  //               AppInstanceUserArn: appInstanceUserArn,
  //             }),
  //           );

  //         const metadata: ChannelMetadata = JSON.parse(
  //           data.Channel?.ChannelSummary?.Metadata!,
  //         );

  //         if (data) {
  //           setChannel({
  //             appointmentTimestamp: new Date(metadata.appointmentTimestamp),
  //             doctor: metadata.doctor,
  //             patient: metadata.patient,
  //             presenceMap: metadata.presenceMap,
  //             summary: data.Channel?.ChannelSummary,
  //             sfnExecutionArn: metadata.sfnExecutionArn,
  //           } as Channel);
  //         }
  //       } catch (error) {
  //         console.error(error);
  //       }
  //     })();
  //   },
  //   [appInstanceUserArn, messagingClient, mountedRef],
  // );

  // useEffect(() => {
  //   let observer: MessagingSessionObserver;
  //   if (messagingSession) {
  //     observer = {
  //       messagingSessionDidReceiveMessage: (message: Message) => {
  //         if (message.type === 'CREATE_CHANNEL_MESSAGE' && !channel) {
  //           const messageObj = JSON.parse(message.payload) as ChannelMessage;
  //           if (
  //             messageObj.Content === 'Sending%20a%20meeting%20invite' &&
  //             messageObj.Sender?.Arn !== appInstanceUserArn
  //           ) {
  //             // console.log('MeetingInvite!');
  //             // console.log(message);
  //             const channelArn = messageObj.ChannelArn;
  //             const metadata: MessageMetadata = JSON.parse(
  //               messageObj.Metadata!,
  //             );
  //             const meetingId = metadata.meetingId;
  //             // console.log(`channelArn=${channelArn}`);
  //             // console.log(`meetingId=${meetingId}`);
  //             setMeetingId(meetingId);
  //             getChannel(channelArn ?? '');
  //           }
  //           //
  //         }
  //       },
  //     };
  //     messagingSession.addObserver(observer);
  //     // refreshChannels();
  //   }
  //   return () => {
  //     messagingSession?.removeObserver(observer);
  //   };
  // }, [messagingSession, getChannel, channel]);

  const onCleanUpPatient = useCallback(() => {}, []);

  return (
    <div className="AppointmentList">
      {accountType === AccountType.Doctor && callChannel && (
        <MeetingDoctorView channel={callChannel} onCleanUp={onCleanUpPatient} />
      )}
      {accountType === AccountType.Patient && meetingId && callChannel && (
        // We must pass the meeting ID as a key because MeetingPatientView does not support the case when
        // only the meeting ID prop changes. Providing a unique key will mount a new copy of MeetingPatientView.
        <MeetingPatientView
          key={meetingId}
          channel={callChannel}
          meetingId={meetingId}
          onCleanUp={onCleanUpPatient}
        />
      )}
    </div>
  );
}
