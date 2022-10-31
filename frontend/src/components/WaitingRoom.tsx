import { ReactNode, useCallback, useEffect, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';

import { useAuth } from '../providers/AuthProvider';
import { useAwsClient } from '../providers/AwsClientProvider';
// import { useRoute } from '../providers/RouteProvider';
import { Channel, ChannelMetadata } from '../types';
// import Chat from './Chat';
import './DirectCall.css';

// import Config from '../utils/Config';
import { InvocationType, InvokeCommand, LogType } from '@aws-sdk/client-lambda';
import { useRuntime } from '../providers/RuntimeProvider';
import {
  CreateAppointmentFunctionEvent,
  DeleteAppointmentFunctionEvent,
} from '../types/lambda';

import {
  ChannelSummary,
  ListChannelsCommand,
} from '@aws-sdk/client-chime-sdk-messaging';
import { Message, MessagingSessionObserver } from 'amazon-chime-sdk-js';
import dayjs from 'dayjs';
import { AccountType } from '../constants';
import useMountedRef from '../hooks/useMountedRef';
import { useMessaging } from '../providers/MessagingProvider';

// const REFRESH_INTERVAL = 1000;
// const RETRIES = 1;
// let timeoutId: ReturnType<typeof setTimeout>;

export default function WaitingRoom(): JSX.Element {
  const {
    createWaitingRoomFunctionArn,
    deleteAppointmentFunctionArn,
    appInstanceArn,
    createAppointmentFunctionArn,
  } = useRuntime();
  const { lambdaClient } = useAwsClient();
  const { user, appInstanceUserArn, accountType } = useAuth();
  // const [channel, setChannel] = useState<Channel>();
  const [channels, setChannels] = useState<Channel[]>();
  const { messagingSession } = useMessaging();
  const { messagingClient } = useAwsClient();
  const mountedRef = useMountedRef();
  // const { setRoute } = useRoute();

  const listChannels = useCallback(async () => {
    (async () => {
      try {
        const channels: ChannelSummary[] = [];
        let nextToken: string | undefined;
        do {
          const data = await messagingClient.send(
            new ListChannelsCommand({
              AppInstanceArn: appInstanceArn,
              ChimeBearer: appInstanceUserArn,
              NextToken: nextToken,
            }),
          );
          channels.push(...(data.Channels || []));
          nextToken = data.NextToken;
        } while (nextToken);
        if (!mountedRef.current) {
          return;
        }

        setChannels(
          channels
            .filter((channel) => {
              const metadata: ChannelMetadata = JSON.parse(channel.Metadata!);
              return metadata.type === 'waitingroom';
            })
            .map<Channel>((channel: ChannelSummary) => {
              const metadata: ChannelMetadata = JSON.parse(channel.Metadata!);
              return {
                appointmentTimestamp: new Date(metadata.appointmentTimestamp),
                doctor: metadata.doctor,
                patient: metadata.patient,
                presenceMap: metadata.presenceMap,
                summary: channel,
                sfnExecutionArn: metadata.sfnExecutionArn,
              } as Channel;
            })
            .sort(
              (channel1: Channel, channel2: Channel) =>
                channel1.appointmentTimestamp.getTime() -
                channel2.appointmentTimestamp.getTime(),
            ),
        );
      } catch (error) {
        console.error(error);
      }
    })();
  }, [appInstanceUserArn, messagingClient, mountedRef]);

  const onClickWait = useCallback(async () => {
    // setLoading(true);
    console.log('onClickWait');

    const response = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: createWaitingRoomFunctionArn,
        InvocationType: InvocationType.RequestResponse,
        LogType: LogType.None,
        Payload: new TextEncoder().encode(
          JSON.stringify({
            // doctorUsername: user.username,
            patientUsername: user.username,
            timestamp: dayjs(Date.now()).second(0).millisecond(0).toISOString(),
            // existingChannelName: channelName,
          } as CreateAppointmentFunctionEvent),
        ),
      }),
    );

    console.log(response);
  }, [lambdaClient, user]);

  const onClickLeave = useCallback(async () => {
    console.log('onClickLeave');

    const response = await lambdaClient.send(
      new InvokeCommand({
        FunctionName: deleteAppointmentFunctionArn,
        InvocationType: InvocationType.RequestResponse,
        LogType: LogType.None,
        Payload: new TextEncoder().encode(
          JSON.stringify({
            appInstanceUserArn,
            channelArn: channels?.[0].summary.ChannelArn,
          } as DeleteAppointmentFunctionEvent),
        ),
      }),
    );
    console.log(response);
  }, [lambdaClient, user, channels]);

  const onClickJoin = useCallback(async () => {
    console.log('onClickJoin');

    const channel = channels?.[0];

    await lambdaClient.send(
      new InvokeCommand({
        FunctionName: createAppointmentFunctionArn,
        InvocationType: InvocationType.RequestResponse,
        LogType: LogType.None,
        Payload: new TextEncoder().encode(
          JSON.stringify({
            doctorUsername: user.username,
            patientUsername: channel?.patient.username,
            timestamp: dayjs(Date.now()).second(0).millisecond(0).toISOString(),
          } as CreateAppointmentFunctionEvent),
        ),
      }),
    );

    if (channel) onClickDelete(channel);
  }, [lambdaClient, user, channels]);

  useEffect(() => {
    const refreshChannels = () => {
      listChannels();
    };

    let observer: MessagingSessionObserver;
    if (messagingSession) {
      observer = {
        messagingSessionDidReceiveMessage: (message: Message) => {
          if (
            message.type === 'CREATE_CHANNEL_MEMBERSHIP' ||
            message.type === 'DELETE_CHANNEL' ||
            message.type === 'UPDATE_CHANNEL'
          ) {
            refreshChannels();
          }
        },
      };
      messagingSession.addObserver(observer);
      refreshChannels();
    }
    return () => {
      messagingSession?.removeObserver(observer);
    };
  }, [messagingSession, listChannels]);

  useEffect(() => {
    let observer: MessagingSessionObserver;
    if (messagingSession) {
      observer = {
        messagingSessionDidReceiveMessage: (message: Message) => {
          console.log(message);
          // if (message.type === 'CREATE_CHANNEL_MESSAGE' && !channel) {
          //   const messageObj = JSON.parse(message.payload) as ChannelMessage;
          //   if (
          //     messageObj.Content === 'Sending%20a%20meeting%20invite' &&
          //     messageObj.Sender?.Arn !== appInstanceUserArn
          //   ) {
          //     console.log('MeetingInvite!');
          //     console.log(message);
          //     const channelArn = messageObj.ChannelArn;
          //     const metadata: MessageMetadata = JSON.parse(
          //       messageObj.Metadata!,
          //     );
          //     const meetingId = metadata.meetingId;
          //     console.log(`channelArn=${channelArn}`);
          //     console.log(`meetingId=${meetingId}`);
          //     getChannel(channelArn ?? '');
          //   }
          //   //
          // }
        },
      };
      messagingSession.addObserver(observer);
      // refreshChannels();
    }
    return () => {
      messagingSession?.removeObserver(observer);
    };
  }, [messagingSession]);

  const onClickDelete = useCallback(
    (channel: Channel) => {
      (async () => {
        try {
          await lambdaClient.send(
            new InvokeCommand({
              FunctionName: deleteAppointmentFunctionArn,
              InvocationType: InvocationType.RequestResponse,
              LogType: LogType.None,
              Payload: new TextEncoder().encode(
                JSON.stringify({
                  appInstanceUserArn:
                    accountType === AccountType.Patient
                      ? appInstanceUserArn
                      : `${appInstanceArn}/user/${channel?.patient.username}`,
                  channelArn: channel.summary.ChannelArn,
                } as DeleteAppointmentFunctionEvent),
              ),
            }),
          );

          await listChannels();
        } catch (error: any) {
          console.error(error);
        } finally {
        }
      })();
    },
    [appInstanceUserArn, lambdaClient],
  );

  const createList = (channels?: Channel[]): ReactNode => {
    if (!channels?.length) {
      return <></>;
    }
    return (
      <>
        <div className="AppointmentList__listTitle">Waiting Rooms</div>
        <ul className="AppointmentList__list">
          {channels.map((channel: Channel) => (
            <li
              className="AppointmentList__listItem"
              key={channel.summary.ChannelArn}
            >
              <div className="AppointmentList__nameContainer">
                <div className="AppointmentList__name">
                  {'Patient: ' + channel.patient.name}
                </div>
              </div>
              <div className="AppointmentList__buttonContainer">
                <button
                  className="AppointmentList__button"
                  onClick={() => {
                    onClickDelete(channel);
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </>
    );
  };

  return (
    <div className="DirectCall">
      <div className="DirectCall__form">
        {accountType === AccountType.Patient && (
          <>
            {channels?.length === 0 && (
              <button
                className="AppointmentView__callButton"
                onClick={onClickWait}
              >
                Wait
              </button>
            )}
            {(channels?.length ?? 0) > 0 && (
              <button
                className="AppointmentView__callButton"
                onClick={onClickLeave}
              >
                Leave
              </button>
            )}
          </>
        )}
        {accountType === AccountType.Doctor && (
          <button className="AppointmentView__callButton" onClick={onClickJoin}>
            Join
          </button>
        )}
        <div className="AppointmentList__listContainer">
          {createList(channels)}
        </div>
      </div>
    </div>
  );
}
