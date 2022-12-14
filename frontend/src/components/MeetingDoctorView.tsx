import {
  ChannelMessagePersistenceType,
  ChannelMessageType,
  SendChannelMessageCommand,
} from '@aws-sdk/client-chime-sdk-messaging';
import { InvocationType, InvokeCommand, LogType } from '@aws-sdk/client-lambda';
import { MeetingProvider } from 'amazon-chime-sdk-component-library-react';
import { Message, MessagingSessionObserver } from 'amazon-chime-sdk-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { MeetingInviteStatus, ReservedMessageContent } from '../constants';
import useMeetingFunctions from '../hooks/useMeetingFunctions';
import useMountedRef from '../hooks/useMountedRef';
import { useAuth } from '../providers/AuthProvider';
import { useAwsClient } from '../providers/AwsClientProvider';
import { useMessaging } from '../providers/MessagingProvider';
import { useRuntime } from '../providers/RuntimeProvider';
import { Channel, MeetingAPIResponse, MessageMetadata } from '../types';
import { MakeOutboundCallFunctionEvent } from '../types/lambda';
import './MeetingDoctorView.css';
import MeetingWidget from './MeetingWidget';
import Window from './Window';
// import Config from '../utils/Config';

interface Props {
  channel: Channel;
  onCleanUp: () => void;
}

export default function MeetingDoctorView({ channel, onCleanUp }: Props) {
  const channelArn = channel.summary.ChannelArn;
  const { makeOutboundCallFunctionArn } = useRuntime();
  const { lambdaClient, messagingClient } = useAwsClient();
  const { appInstanceUserArn, user } = useAuth();
  const { messagingSession, clientId } = useMessaging();
  const mountedRef = useMountedRef();
  const { createMeeting } = useMeetingFunctions();
  const [joinInfo, setJoinInfo] = useState<MeetingAPIResponse>();
  const [meetingInviteStatus, setMeetingInviteStatus] = useState(
    MeetingInviteStatus.Unknown,
  );
  const meetingInviteStatusRef =
    useRef<MeetingInviteStatus>(meetingInviteStatus);
  const timeoudRef = useRef<ReturnType<typeof setTimeout>>();
  const { t } = useTranslation();
  const [called, setCalled] = useState<boolean>(false);

  useEffect(() => {
    if (!joinInfo) {
      return;
    }

    const observer: MessagingSessionObserver = {
      messagingSessionDidReceiveMessage: (message: Message) => {
        if (message.headers['x-amz-chime-message-type'] === 'CONTROL') {
          return;
        }
        if (message.type === 'CREATE_CHANNEL_MESSAGE') {
          const payload = JSON.parse(message.payload);
          try {
            const metadata = JSON.parse(payload.Metadata) as MessageMetadata;
            const senderUsername = payload.Sender.Arn.split('/user/')[1];
            if (
              senderUsername === channel.recipient.username &&
              metadata.isMeetingInvitation &&
              metadata.meetingId === joinInfo.Meeting.MeetingId
            ) {
              meetingInviteStatusRef.current = metadata.meetingInviteStatus!;
              setMeetingInviteStatus(meetingInviteStatusRef.current);
            }
          } catch (error: any) {
            console.warn(
              `MeetingDoctorView::messagingSessionDidReceiveMessage::Failed to decode the message content`,
              error,
            );
          }
        }
      },
    };
    messagingSession?.addObserver(observer);
    return () => {
      messagingSession?.removeObserver(observer);
    };
  }, [
    channelArn,
    joinInfo,
    messagingSession,
    user.username,
    channel.recipient.username,
  ]);

  useEffect(() => {
    if (meetingInviteStatus === MeetingInviteStatus.Declined) {
      onCleanUp();
    }
  }, [meetingInviteStatus, onCleanUp]);

  useEffect(() => {
    return () => {
      // We must use "meetingInviteStatusRef.current" to send the cancel message only when
      // the status is unknown during unmounting.
      if (
        joinInfo &&
        meetingInviteStatusRef.current === MeetingInviteStatus.Unknown
      ) {
        try {
          messagingClient.send(
            new SendChannelMessageCommand({
              ChannelArn: channelArn,
              Content: encodeURIComponent(
                ReservedMessageContent.CanceledInvite,
              ),
              ChimeBearer: appInstanceUserArn,
              Type: ChannelMessageType.STANDARD,
              Persistence: ChannelMessagePersistenceType.NON_PERSISTENT,
              Metadata: JSON.stringify({
                clientId,
                isMeetingInvitation: true,
                isPresence: true,
                meetingId: joinInfo.Meeting.MeetingId,
                meetingInviteStatus: MeetingInviteStatus.Cancel,
              } as MessageMetadata),
            }),
          );
        } catch (error: any) {
          console.error(error);
        }
      }
    };
  }, [
    appInstanceUserArn,
    channelArn,
    clientId,
    joinInfo,
    messagingClient,
    onCleanUp,
  ]);

  useEffect(() => {
    if (
      !mountedRef.current ||
      meetingInviteStatus === MeetingInviteStatus.Accepted ||
      meetingInviteStatus === MeetingInviteStatus.Declined
    ) {
      if (timeoudRef.current) {
        clearTimeout(timeoudRef.current);
      }
      return;
    }

    (async () => {
      const response = await createMeeting(channel);
      if (!mountedRef.current) {
        return;
      }

      setJoinInfo(response);

      (async function sendRequest() {
        try {
          await messagingClient.send(
            new SendChannelMessageCommand({
              ChannelArn: channelArn,
              Content: encodeURIComponent(ReservedMessageContent.SendingInvite),
              ChimeBearer: appInstanceUserArn,
              Type: ChannelMessageType.STANDARD,
              Persistence: ChannelMessagePersistenceType.NON_PERSISTENT,
              Metadata: JSON.stringify({
                clientId,
                isMeetingInvitation: true,
                isPresence: true,
                meetingId: response.Meeting.MeetingId,
                meetingInviteStatus: MeetingInviteStatus.Unknown,
              } as MessageMetadata),
            }),
          );
        } catch (error: any) {
          console.error(error);
        }

        if (
          mountedRef.current &&
          meetingInviteStatusRef.current === MeetingInviteStatus.Unknown
        ) {
          timeoudRef.current = setTimeout(sendRequest, 1000);
        }
      })();
    })();

    return () => {
      if (timeoudRef.current) {
        clearTimeout(timeoudRef.current);
      }
    };
  }, [
    appInstanceUserArn,
    channel,
    channelArn,
    clientId,
    createMeeting,
    meetingInviteStatus,
    messagingClient,
    messagingSession,
    mountedRef,
    user.username,
  ]);

  const onClickPhoneCall = useCallback(async () => {
    if (joinInfo) {
      setCalled(true);
      try {
        await lambdaClient.send(
          new InvokeCommand({
            FunctionName: makeOutboundCallFunctionArn,
            InvocationType: InvocationType.RequestResponse,
            LogType: LogType.None,
            Payload: new TextEncoder().encode(
              JSON.stringify({
                channelArn,
                clientId,
                doctorUsername: channel.caller.username,
                patientUsername: channel.recipient.username,
                meetingId: joinInfo.Meeting.MeetingId,
              } as MakeOutboundCallFunctionEvent),
            ),
          }),
        );
      } catch (error: any) {
        console.error(error);
      }
    }
  }, [
    channel.caller.username,
    channel.recipient.username,
    channelArn,
    clientId,
    joinInfo,
    lambdaClient,
    setCalled,
  ]);

  const onClickCancel = useCallback(() => {
    onCleanUp();
  }, [onCleanUp]);

  return (
    <Window
      className="MeetingDoctorView__window"
      isPortal
      title={t('MeetingDoctorView.title', {
        name: channel.recipient.name,
      })}
    >
      <div className="MeetingDoctorView">
        {meetingInviteStatus === MeetingInviteStatus.Declined && (
          <div className="MeetingDoctorView__progressUpdateContainer">
            <p>
              {t('MeetingDoctorView.declined', {
                name: channel.recipient.name,
              })}
            </p>
          </div>
        )}
        {meetingInviteStatus === MeetingInviteStatus.Unknown && (
          <div className="MeetingDoctorView__progressUpdateContainer">
            <div className="MeetingDoctorView__waitingContainer">
              <p className="MeetingDoctorView__waiting">
                <Trans
                  i18nKey={'MeetingDoctorView.waiting'}
                  values={{ name: channel.recipient.name }}
                />
              </p>
              <button
                type="submit"
                className="MeetingDoctorView__cancelButton"
                onClick={onClickCancel}
                disabled={!joinInfo}
              >
                {'Cancel'}
              </button>
            </div>
            <p className="MeetingDoctorView__phoneCallDescription">
              {t('MeetingDoctorView.phoneCallDescription')}
            </p>
            <button
              className="MeetingDoctorView__phoneCallButton"
              onClick={onClickPhoneCall}
              disabled={!joinInfo || called}
            >
              {called
                ? t('MeetingDoctorView.calling')
                : t('MeetingDoctorView.phoneCall')}
            </button>
          </div>
        )}
        {joinInfo && meetingInviteStatus === MeetingInviteStatus.Accepted && (
          <MeetingProvider>
            <MeetingWidget
              attendee={joinInfo.Attendee}
              meeting={joinInfo.Meeting}
              onCleanUp={onCleanUp}
              remoteAttendeeName={channel.recipient.name}
            />
          </MeetingProvider>
        )}
      </div>
    </Window>
  );
}
