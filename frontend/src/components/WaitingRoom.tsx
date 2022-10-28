import {
  ListUsersInGroupCommand,
  UserType,
} from '@aws-sdk/client-cognito-identity-provider';
import { useCallback, useEffect, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';

import { useAuth } from '../providers/AuthProvider';
import { useAwsClient } from '../providers/AwsClientProvider';
// import { useRoute } from '../providers/RouteProvider';
import { Channel, ChannelMetadata, CognitoUser } from '../types';
// import Chat from './Chat';
import './DirectCall.css';

// import Config from '../utils/Config';
import { InvocationType, InvokeCommand, LogType } from '@aws-sdk/client-lambda';
import useMountedRef from '../hooks/useMountedRef';
import { useRuntime } from '../providers/RuntimeProvider';
import { DeleteAppointmentFunctionEvent } from '../types/lambda';

import {
  ChannelModeratedByAppInstanceUserSummary,
  ListChannelsModeratedByAppInstanceUserCommand,
} from '@aws-sdk/client-chime-sdk-messaging';
import { Message, MessagingSessionObserver } from 'amazon-chime-sdk-js';
import { v4 as uuidv4 } from 'uuid';
import { useMessaging } from '../providers/MessagingProvider';
import MeetingDoctorView from './MeetingDoctorView';

// const REFRESH_INTERVAL = 1000;
// const RETRIES = 1;
// let timeoutId: ReturnType<typeof setTimeout>;

export default function WaitingRoom(): JSX.Element {
  // const { setRoute } = useRoute();
  const {
    patientUserPoolGroupName,
    cognitoUserPoolId,
    deleteAppointmentFunctionArn,
  } = useRuntime();
  const { cognitoClient, lambdaClient, messagingClient } = useAwsClient();
  const { user, appInstanceUserArn } = useAuth();
  // const [startDate, setStartDate] = useState(new Date());
  const [patients, setPatients] = useState<CognitoUser[]>([]);
  // const [loading, setLoading] = useState<boolean>(false);
  // const [channelName, setChannelName] = useState<string | undefined>(undefined);
  const mountedRef = useMountedRef();
  // const cleanedUpMeetingIdsRef = useRef<Set<string>>(new Set());
  const [showMeetingDoctorView, setShowMeetingDoctorView] = useState(false);
  // const [channels, setChannels] = useState<Channel[]>();
  const [channel, setChannel] = useState<Channel>();
  const { messagingSession } = useMessaging();

  const listChannels = useCallback(
    async (channelName: string) => {
      (async () => {
        // console.log('listChannels');
        try {
          let channels: ChannelModeratedByAppInstanceUserSummary[] = [];
          let nextToken: string | undefined;
          do {
            const data = await messagingClient.send(
              new ListChannelsModeratedByAppInstanceUserCommand({
                ChimeBearer: appInstanceUserArn,
                NextToken: nextToken,
              }),
            );
            console.log(`Channels=${JSON.stringify(data.Channels)}`);
            console.log(`channelName=${channelName}`);
            channels.push(
              ...(data.Channels?.filter(
                (channel) => channel.ChannelSummary?.Name === channelName,
              ) || []),
            );
            nextToken = data.NextToken;
          } while (nextToken);
          if (!mountedRef.current) {
            return;
          }

          // console.log(channels);
          const newChannel = channels.map<Channel>(
            (channel: ChannelModeratedByAppInstanceUserSummary) => {
              const metadata: ChannelMetadata = JSON.parse(
                channel.ChannelSummary?.Metadata!,
              );
              return {
                appointmentTimestamp: new Date(metadata.appointmentTimestamp),
                doctor: metadata.doctor,
                patient: metadata.patient,
                presenceMap: metadata.presenceMap,
                summary: channel.ChannelSummary,
                sfnExecutionArn: metadata.sfnExecutionArn,
              } as Channel;
            },
          )?.[0];
          if (newChannel) setChannel(newChannel);
          // if (channel) setShowMeetingDoctorView(true);
        } catch (error) {
          console.error(error);
        }
      })();
    },
    [appInstanceUserArn, messagingClient, mountedRef],
  );

  useEffect(() => {
    (async () => {
      try {
        const users: UserType[] = [];
        let nextToken: string | undefined;
        do {
          const data = await cognitoClient.send(
            new ListUsersInGroupCommand({
              UserPoolId: cognitoUserPoolId,
              GroupName: patientUserPoolGroupName,
              NextToken: nextToken,
            }),
          );
          users.push(...(data.Users || []));
          nextToken = data.NextToken;
        } while (nextToken);

        if (!mountedRef.current) {
          return false;
        }

        console.log('set Patients');
        /**
         * Convert
         * Array: [{ Name: 'hello', value: 'example@email.com' }, { Name: 'email', value: 'example@email.com' }]
         * to
         * Object: { username: 'hello', email: 'example@email.com' }
         */
        setPatients(
          users.map<CognitoUser>((user: UserType) => {
            console.log(user.Username);
            return {
              username: user.Username,
              attributes: user.Attributes?.reduce(
                (previous, current) => ({
                  ...previous,
                  [current.Name!]: current.Value,
                }),
                {},
              ),
            } as CognitoUser;
          }),
        );
      } catch (error) {
        console.error(error);
      }
    })();
  }, [cognitoClient, mountedRef]);

  const onClickWait = useCallback(async () => {
    // setLoading(true);

    const channelName = uuidv4();

    setShowMeetingDoctorView(true);

    // When the backend creates multiple requests of UpdateChannel API simultaneously,
    // the messaging session (WebSocket) sometimes does not receive all UPDATE_CHANNEL messages.
    // Keep refreshing the list 15 seconds later from the previous listChannels() call.

    // let currentRetry: number;

    const refreshChannels = () => {
      // if (channel || currentRetry === 0) {
      //   setLoading(false);
      //   return;
      // }
      // clearTimeout(timeoutId);
      listChannels(channelName);
      // timeoutId = setTimeout(refreshChannels, REFRESH_INTERVAL);
      // currentRetry--;
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
      // currentRetry = RETRIES;
      refreshChannels();
    }
    return () => {
      messagingSession?.removeObserver(observer);
    };
  }, [lambdaClient, patients, channel, user]);

  const onCleanUpDoctor = useCallback(() => {
    console.log('onCleanUpDoctor');
    setShowMeetingDoctorView(false);

    (async () => {
      try {
        console.log(channel);
        await lambdaClient.send(
          new InvokeCommand({
            FunctionName: deleteAppointmentFunctionArn,
            InvocationType: InvocationType.RequestResponse,
            LogType: LogType.None,
            Payload: new TextEncoder().encode(
              JSON.stringify({
                appInstanceUserArn,
                channelArn: channel?.summary.ChannelArn,
              } as DeleteAppointmentFunctionEvent),
            ),
          }),
        );

        setChannel(undefined);
      } catch (error: any) {
        console.error(error);
      } finally {
        // setRoute('AppointmentList');
        // loadingRef.current = false;
      }
    })();
  }, [channel]);

  // const onCleanUpPatient = useCallback(() => {
  //   if (meetingId) {
  //     cleanedUpMeetingIdsRef.current.add(meetingId);
  //     setMeetingId(undefined);
  //   }
  // }, [meetingId]);

  return (
    <div className="DirectCall">
      <div className="DirectCall__form">
        <button className="AppointmentView__callButton" onClick={onClickWait}>
          Wait
        </button>
      </div>
      {
        <>
          {/* {channel && <Chat channel={channel} />} */}
          {showMeetingDoctorView && channel && (
            <MeetingDoctorView channel={channel} onCleanUp={onCleanUpDoctor} />
          )}
          {/*
          {meetingId && channel && (
            // We must pass the meeting ID as a key because MeetingPatientView does not support the case when
            // only the meeting ID prop changes. Providing a unique key will mount a new copy of MeetingPatientView.
            <MeetingPatientView
              key={meetingId}
              channel={channel}
              meetingId={meetingId}
              onCleanUp={onCleanUpPatient}
            />
          )} */}
        </>
      }
    </div>
  );
}
