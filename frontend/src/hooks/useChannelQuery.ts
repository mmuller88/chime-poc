import {
  ChannelMessagePersistenceType,
  ChannelMessageType,
  ChannelModeratedByAppInstanceUserSummary,
  CreateChannelResponse,
  DescribeChannelModeratedByAppInstanceUserCommand,
  DescribeChannelModeratedByAppInstanceUserCommandOutput,
  ListChannelsModeratedByAppInstanceUserCommand,
  SendChannelMessageCommand,
} from '@aws-sdk/client-chime-sdk-messaging';
import { InvocationType, InvokeCommand, LogType } from '@aws-sdk/client-lambda';
import { Message, MessagingSessionObserver } from 'amazon-chime-sdk-js';
import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MeetingInviteStatus, ReservedMessageContent } from '../constants';
import { useAuth } from '../providers/AuthProvider';
import { useAwsClient } from '../providers/AwsClientProvider';
import { useMessaging } from '../providers/MessagingProvider';
import { useRuntime } from '../providers/RuntimeProvider';
import {
  Channel,
  ChannelMetadata,
  MeetingAPIResponse,
  MessageMetadata,
} from '../types';
import {
  CreateAppointmentFunctionEvent,
  DeleteAppointmentFunctionEvent,
} from '../types/lambda';
import useMeetingFunctions from './useMeetingFunctions';
import useMountedRef from './useMountedRef';

export default function useChannelQuery() {
  const { messagingClient, lambdaClient } = useAwsClient();
  const mountedRef = useMountedRef();
  const [channels, setChannels] = useState<Channel[]>();
  const [callChannel, setCallChannel] = useState<Channel>();
  const { createAppointmentFunctionArn, deleteAppointmentFunctionArn } =
    useRuntime();
  const { appInstanceUserArn } = useAuth();
  const { createMeeting } = useMeetingFunctions();
  const [joinInfo, setJoinInfo] = useState<MeetingAPIResponse>();
  const [meetingInviteStatus, setMeetingInviteStatus] = useState(
    MeetingInviteStatus.Unknown,
  );
  const meetingInviteStatusRef =
    useRef<MeetingInviteStatus>(meetingInviteStatus);
  const { messagingSession, clientId } = useMessaging();
  const timeoudRef = useRef<ReturnType<typeof setTimeout>>();

  const listChannels = useCallback(
    async (channelType: 'appointment' | 'waitingroom') => {
      try {
        const channels: ChannelModeratedByAppInstanceUserSummary[] = [];
        let nextToken: string | undefined;
        do {
          const data = await messagingClient.send(
            new ListChannelsModeratedByAppInstanceUserCommand({
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
              const metadata: ChannelMetadata = JSON.parse(
                channel.ChannelSummary?.Metadata!,
              );
              return metadata.type === channelType;
            })
            .map<Channel>(
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
            )
            .sort(
              (channel1: Channel, channel2: Channel) =>
                channel1.appointmentTimestamp.getTime() -
                channel2.appointmentTimestamp.getTime(),
            ),
        );
      } catch (error) {
        console.error(error);
      }
    },
    [messagingClient, mountedRef],
  );

  const getChannel = useCallback(
    async (channelArn: string) => {
      try {
        console.log('getChannel');

        const data: DescribeChannelModeratedByAppInstanceUserCommandOutput =
          await messagingClient.send(
            new DescribeChannelModeratedByAppInstanceUserCommand({
              ChimeBearer: appInstanceUserArn,
              ChannelArn: channelArn,
              AppInstanceUserArn: appInstanceUserArn,
            }),
          );

        const metadata: ChannelMetadata = JSON.parse(
          data.Channel?.ChannelSummary?.Metadata!,
        );

        if (data) {
          return {
            appointmentTimestamp: new Date(metadata.appointmentTimestamp),
            doctor: metadata.doctor,
            patient: metadata.patient,
            presenceMap: metadata.presenceMap,
            summary: data.Channel?.ChannelSummary,
            sfnExecutionArn: metadata.sfnExecutionArn,
          } as Channel;
        }
      } catch (error) {
        console.error(error);
      }
    },
    [appInstanceUserArn, messagingClient, mountedRef],
  );

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
      if (!callChannel) {
        return;
      }
      const response = await createMeeting(callChannel);
      if (!mountedRef.current) {
        return;
      }

      setJoinInfo(response);

      (async function sendRequest() {
        try {
          await messagingClient.send(
            new SendChannelMessageCommand({
              ChannelArn: callChannel.summary.ChannelArn,
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
    callChannel,
    clientId,
    createMeeting,
    meetingInviteStatus,
    messagingClient,
    messagingSession,
    mountedRef,
  ]);

  const deleteCall = useCallback(async () => {
    console.log('useChannelQuery -> deleteCall');

    try {
      if (!callChannel) {
        return;
      }
      await lambdaClient.send(
        new InvokeCommand({
          FunctionName: deleteAppointmentFunctionArn,
          InvocationType: InvocationType.RequestResponse,
          LogType: LogType.None,
          Payload: new TextEncoder().encode(
            JSON.stringify({
              appInstanceUserArn,
              channelArn: callChannel.summary.ChannelArn,
            } as DeleteAppointmentFunctionEvent),
          ),
        }),
      );

      setCallChannel(undefined);
    } catch (error: any) {
      console.error(error);
    } finally {
      // setRoute('AppointmentList');
      // loadingRef.current = false;
    }
  }, [callChannel]);

  const createCall = useCallback(
    async ({ doctorUsername, patientUsername }) => {
      const data = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: createAppointmentFunctionArn,
          InvocationType: InvocationType.RequestResponse,
          LogType: LogType.None,
          Payload: new TextEncoder().encode(
            JSON.stringify({
              doctorUsername: doctorUsername,
              patientUsername: patientUsername,
              timestamp: dayjs(Date.now())
                .second(0)
                .millisecond(0)
                .toISOString(),
            } as CreateAppointmentFunctionEvent),
          ),
        }),
      );
      const appointmentResponse = JSON.parse(
        new TextDecoder().decode(data.Payload),
      );
      if (appointmentResponse.statusCode === 200) {
        const appointmentInfo = JSON.parse(
          appointmentResponse.body,
        ) as CreateChannelResponse;
        const channelArn = appointmentInfo.ChannelArn!;
        const channel = await getChannel(channelArn);

        if (!channel) {
          return;
        }
        setCallChannel(channel);
      }
    },
    [messagingClient, mountedRef],
  );

  useEffect(() => {
    if (!joinInfo) {
      return;
    }

    if (!callChannel) {
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
              senderUsername === callChannel.patient.username &&
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
  }, [callChannel, joinInfo, messagingSession]);

  return {
    channels,
    listChannels,
    createCall,
    callChannel,
    deleteCall,
    meetingInviteStatus,
  };
}
