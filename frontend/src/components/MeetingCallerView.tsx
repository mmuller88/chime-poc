import {
  ChannelMessagePersistenceType,
  ChannelMessageType,
  SendChannelMessageCommand,
} from '@aws-sdk/client-chime-sdk-messaging';
import { InvocationType, InvokeCommand, LogType } from '@aws-sdk/client-lambda';
import { MeetingProvider } from 'amazon-chime-sdk-component-library-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { MeetingInviteStatus, ReservedMessageContent } from '../constants';
import { useAuth } from '../providers/AuthProvider';
import { useAwsClient } from '../providers/AwsClientProvider';
import { useCall } from '../providers/CallProvider';
import { useMessaging } from '../providers/MessagingProvider';
import { useRuntime } from '../providers/RuntimeProvider';
import { Channel, MessageMetadata } from '../types';
import { MakeOutboundCallFunctionEvent } from '../types/lambda';
import './MeetingCallerView.css';
import MeetingWidget from './MeetingWidget';
import Window from './Window';
// import Config from '../utils/Config';

interface Props {
  channel: Channel;
  // onCleanUp: () => void;
}

export default function MeetingCallerView({ channel }: Props) {
  const channelArn = channel.summary.ChannelArn;
  const { makeOutboundCallFunctionArn } = useRuntime();
  const { lambdaClient, messagingClient } = useAwsClient();
  const { appInstanceUserArn } = useAuth();
  const { clientId } = useMessaging();
  const { meetingInviteStatus, joinInfo, deleteCall } = useCall();
  const meetingInviteStatusRef =
    useRef<MeetingInviteStatus>(meetingInviteStatus);
  const { t } = useTranslation();
  const [called, setCalled] = useState<boolean>(false);

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
    // onCleanUp,
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

  const onClickCancel = useCallback(async () => {
    await deleteCall();
    // onCleanUp();
  }, []);

  return (
    <Window
      className="MeetingCallerView__window"
      // isPortal
      title={t('MeetingCallerView.title', {
        name: channel.recipient.name,
      })}
    >
      <div className="MeetingCallerView">
        {meetingInviteStatus === MeetingInviteStatus.Declined && (
          <div className="MeetingCallerView__progressUpdateContainer">
            <p>
              {t('MeetingCallerView.declined', {
                name: channel.recipient.name,
              })}
            </p>
          </div>
        )}
        {meetingInviteStatus === MeetingInviteStatus.Unknown && (
          <div className="MeetingCallerView__progressUpdateContainer">
            <div className="MeetingCallerView__waitingContainer">
              <p className="MeetingCallerView__waiting">
                <Trans
                  i18nKey={'MeetingCallerView.waiting'}
                  values={{ name: channel.recipient.name }}
                />
              </p>
              <button
                type="submit"
                className="MeetingCallerView__cancelButton"
                onClick={onClickCancel}
                disabled={!joinInfo}
              >
                {'Cancel'}
              </button>
            </div>
            <p className="MeetingCallerView__phoneCallDescription">
              {t('MeetingCallerView.phoneCallDescription')}
            </p>
            <button
              className="MeetingCallerView__phoneCallButton"
              onClick={onClickPhoneCall}
              disabled={!joinInfo || called}
            >
              {called
                ? t('MeetingCallerView.calling')
                : t('MeetingCallerView.phoneCall')}
            </button>
          </div>
        )}
        {joinInfo && meetingInviteStatus === MeetingInviteStatus.Accepted && (
          <MeetingProvider>
            <MeetingWidget
              attendee={joinInfo.Attendee}
              meeting={joinInfo.Meeting}
              onCleanUp={() => {}}
              remoteAttendeeName={channel.recipient.name}
            />
          </MeetingProvider>
        )}
      </div>
    </Window>
  );
}
