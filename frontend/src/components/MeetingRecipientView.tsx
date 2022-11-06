import {
  ChannelMessagePersistenceType,
  ChannelMessageType,
  SendChannelMessageCommand,
} from '@aws-sdk/client-chime-sdk-messaging';
import { MeetingProvider } from 'amazon-chime-sdk-component-library-react';
import { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Window from './Window';

import { MeetingInviteStatus, ReservedMessageContent } from '../constants';
import useMeetingFunctions from '../hooks/useMeetingFunctions';
import { useAuth } from '../providers/AuthProvider';
import { useAwsClient } from '../providers/AwsClientProvider';
import { useMessaging } from '../providers/MessagingProvider';
import { Channel, MeetingAPIResponse, MessageMetadata } from '../types';
import './MeetingPatientView.css';
import MeetingWidget from './MeetingWidget';

interface Props {
  number: number;
  channel: Channel;
  meetingId: string;
  onCleanUp: () => void;
}

export default function MeetingRecipientView({
  channel,
  meetingId,
  onCleanUp,
}: Props) {
  const { messagingClient } = useAwsClient();
  const { appInstanceUserArn } = useAuth();
  const { clientId } = useMessaging();
  const { createAttendee } = useMeetingFunctions();
  const [joinInfo, setJoinInfo] = useState<MeetingAPIResponse>();
  const [showStartingMeeting, setShowStartingMeeting] = useState(false);
  const { t } = useTranslation();
  // const { deleteCall } = useCall();

  const onClickAccept = useCallback(async () => {
    setShowStartingMeeting(true);
    try {
      await messagingClient.send(
        new SendChannelMessageCommand({
          ChannelArn: channel.summary.ChannelArn,
          Content: encodeURIComponent(ReservedMessageContent.AcceptedInvite),
          ChimeBearer: appInstanceUserArn,
          Type: ChannelMessageType.STANDARD,
          Persistence: ChannelMessagePersistenceType.NON_PERSISTENT,
          Metadata: JSON.stringify({
            isPresence: true,
            clientId,
            isMeetingInvitation: true,
            meetingInviteStatus: MeetingInviteStatus.Accepted,
            meetingId,
          } as MessageMetadata),
        }),
      );
      const response = await createAttendee(channel, meetingId!);
      // console.log(`createAttendee=${JSON.stringify(response)}`);
      setJoinInfo(response);
      setShowStartingMeeting(false);
    } catch (error: any) {
      console.error(error);
    }
  }, [
    appInstanceUserArn,
    channel,
    clientId,
    createAttendee,
    meetingId,
    messagingClient,
  ]);

  const onClickDecline = useCallback(async () => {
    // await deleteCall();
    // try {
    //   // No "await" needed to unmount right after denying an invite
    //   messagingClient.send(
    //     new SendChannelMessageCommand({
    //       ChannelArn: channel.summary.ChannelArn,
    //       Content: encodeURIComponent(ReservedMessageContent.DeclinedInvite),
    //       ChimeBearer: appInstanceUserArn,
    //       Type: ChannelMessageType.STANDARD,
    //       Persistence: ChannelMessagePersistenceType.NON_PERSISTENT,
    //       Metadata: JSON.stringify({
    //         isPresence: true,
    //         clientId,
    //         isMeetingInvitation: true,
    //         meetingInviteStatus: MeetingInviteStatus.Declined,
    //         meetingId,
    //       } as MessageMetadata),
    //     }),
    //   );
    //   onCleanUp();
    // } catch (error: any) {
    //   console.error(error);
    // }
  }, [
    appInstanceUserArn,
    channel.summary.ChannelArn,
    clientId,
    meetingId,
    messagingClient,
    onCleanUp,
  ]);

  return (
    <Window
      className="MeetingPatientView__window"
      isPortal
      title={t('MeetingPatientView.title', {
        name: channel.caller.name,
      })}
    >
      <div className="MeetingPatientView">
        {!joinInfo && !showStartingMeeting && (
          <div className="MeetingPatientView__invitationContainer">
            <p>
              <Trans
                i18nKey={'MeetingPatientView.received'}
                values={{
                  name: channel.caller.name,
                }}
              />
            </p>
            <button
              className="MeetingPatientView__acceptButton"
              onClick={onClickAccept}
            >
              {t('MeetingPatientView.accept')}
            </button>
            <button
              className="MeetingPatientView__declineButton"
              onClick={onClickDecline}
            >
              {t('MeetingPatientView.decline')}
            </button>
          </div>
        )}
        {showStartingMeeting && (
          <div className="MeetingPatientView__progressUpdateContainer">
            <p>
              <Trans
                i18nKey={'MeetingPatientView.starting'}
                values={{
                  name: channel.caller.name,
                }}
              />
            </p>
          </div>
        )}
        {joinInfo && (
          <MeetingProvider>
            <MeetingWidget
              attendee={joinInfo.Attendee}
              meeting={joinInfo.Meeting}
              onCleanUp={onCleanUp}
              remoteAttendeeName={channel.caller.name}
            />
          </MeetingProvider>
        )}
      </div>
    </Window>
  );
}
