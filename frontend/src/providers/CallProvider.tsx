import {
  ChannelMessage,
  ChannelMessagePersistenceType,
  ChannelMessageType,
  CreateChannelResponse,
  DescribeChannelModeratedByAppInstanceUserCommand,
  DescribeChannelModeratedByAppInstanceUserCommandOutput,
  SendChannelMessageCommand,
} from '@aws-sdk/client-chime-sdk-messaging';
import { InvocationType, InvokeCommand, LogType } from '@aws-sdk/client-lambda';
import { Message, MessagingSessionObserver } from 'amazon-chime-sdk-js';
import dayjs from 'dayjs';
import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { MeetingInviteStatus, ReservedMessageContent } from '../constants';
import useMeetingFunctions from '../hooks/useMeetingFunctions';
import useMountedRef from '../hooks/useMountedRef';
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

interface CallValue {
  createCall: (createCallInput: {
    doctorUsername: string;
    patientUsername: string;
  }) => Promise<void>;
  callChannel: Channel | undefined;
  deleteCall: () => Promise<void>;
  meetingInviteStatus: MeetingInviteStatus;
  joinInfo: MeetingAPIResponse | undefined;
  meetingId: string | undefined;
}

const CallContext = React.createContext<CallValue | undefined>(undefined);

export function useCall(): CallValue {
  const value = useContext(CallContext);
  if (!value) {
    throw new Error('Call must be used within CallProvider');
  }
  return value;
}

export default function CallProvider({ children }: { children: ReactNode }) {
  const { messagingClient, lambdaClient } = useAwsClient();
  const mountedRef = useMountedRef();
  const [callChannel, setCallChannel] = useState<Channel>();
  const { createAppointmentFunctionArn, deleteAppointmentFunctionArn } =
    useRuntime();
  const { createMeeting } = useMeetingFunctions();
  const [joinInfo, setJoinInfo] = useState<MeetingAPIResponse>();
  const [meetingId, setMeetingId] = useState<string>();
  const [meetingInviteStatus, setMeetingInviteStatus] = useState(
    MeetingInviteStatus.Unknown,
  );
  const meetingInviteStatusRef =
    useRef<MeetingInviteStatus>(meetingInviteStatus);
  const { messagingSession, clientId } = useMessaging();
  const timeoudRef = useRef<ReturnType<typeof setTimeout>>();
  const { appInstanceUserArn, accountType } = useAuth();
  // const presenceMap = useRef<{ [key: string]: number }>({});
  // When a doctor chooses "Call," the MeetingDoctorView component repeats sending meeting invitation messages
  // until the MeetingPatientView component accepts or denies it. Use the following Set to avoid handling
  // the already-denied meeting invitation. (e.g., an old invitation can arrive late in slow internet connection.)
  const cleanedUpMeetingIdsRef = useRef<Set<string>>(new Set());

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
      if (!response) {
        return;
      }

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
          timeoudRef.current = setTimeout(sendRequest, 5000);
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
    timeoudRef,
  ]);

  useEffect(() => {
    if (!joinInfo || !callChannel) {
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
  }, [callChannel, , joinInfo, messagingSession]);

  const deleteCall = useCallback(async () => {
    console.log('useChannelQuery -> deleteCall');
    if (!callChannel) {
      return;
    }

    if (meetingId) {
      cleanedUpMeetingIdsRef.current.add(meetingId);
      setMeetingId(undefined);
    }

    try {
      // No "await" needed to unmount right after denying an invite
      messagingClient.send(
        new SendChannelMessageCommand({
          ChannelArn: callChannel.summary.ChannelArn,
          Content: encodeURIComponent(ReservedMessageContent.DeclinedInvite),
          ChimeBearer: appInstanceUserArn,
          Type: ChannelMessageType.STANDARD,
          Persistence: ChannelMessagePersistenceType.NON_PERSISTENT,
          Metadata: JSON.stringify({
            isPresence: true,
            clientId,
            isMeetingInvitation: true,
            meetingInviteStatus: MeetingInviteStatus.Declined,
            meetingId,
          } as MessageMetadata),
        }),
      );
    } catch (error: any) {
      console.error(error);
    }

    try {
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

  useEffect(() => {
    let observer: MessagingSessionObserver;

    if (messagingSession) {
      observer = {
        messagingSessionDidReceiveMessage: async (message: Message) => {
          if (message.type === 'CREATE_CHANNEL_MESSAGE' && !callChannel) {
            const messageObj = JSON.parse(message.payload) as ChannelMessage;
            if (
              messageObj.Content === 'Sending%20a%20meeting%20invite' &&
              messageObj.Sender?.Arn !== appInstanceUserArn
            ) {
              // console.log('MeetingInvite!');
              // console.log(message);
              const channelArn = messageObj.ChannelArn;
              const metadata: MessageMetadata = JSON.parse(
                messageObj.Metadata!,
              );
              const meetingId = metadata.meetingId;
              // console.log(`channelArn=${channelArn}`);
              // console.log(`meetingId=${meetingId}`);
              setMeetingId(meetingId);
              const channel = await getChannel(channelArn ?? '');
              setCallChannel(channel);
            }
            //
          }
        },
      };
      messagingSession.addObserver(observer);
      // refreshChannels();
    }

    return () => {
      messagingSession?.removeObserver(observer);
    };
  }, [messagingSession, getChannel, callChannel]);

  // useEffect(() => {
  //   let observer: MessagingSessionObserver;
  //   if (messagingSession) {
  //     observer = {
  //       messagingSessionDidReceiveMessage: (message: Message) => {
  //         if (!callChannel) {
  //           return;
  //         }
  //         if (message.type === 'CREATE_CHANNEL_MESSAGE') {
  //           const payload = JSON.parse(message.payload);
  //           if (payload.ChannelArn !== callChannel.summary.ChannelArn) {
  //             return;
  //           }
  //           const senderUsername = payload.Sender.Arn.split('/user/')[1];
  //           if (message.headers['x-amz-chime-message-type'] === 'CONTROL') {
  //             let content = decodeURIComponent(payload.Content);
  //             if (content === 'ping') {
  //               presenceMap.current[senderUsername] = Date.now();
  //             }
  //             return;
  //           }
  //           try {
  //             const metadata = JSON.parse(payload.Metadata) as MessageMetadata;
  //             if (
  //               // accountType === AccountType.Patient &&
  //               metadata.isMeetingInvitation &&
  //               // senderUsername === callChannel.doctor.username &&
  //               metadata.meetingId &&
  //               !cleanedUpMeetingIdsRef.current.has(metadata.meetingId)
  //             ) {
  //               if (
  //                 metadata.meetingInviteStatus === MeetingInviteStatus.Unknown
  //               ) {
  //                 console.log('setMeetingId(metadata.meetingId)');
  //                 setMeetingId(metadata.meetingId);
  //               } else if (
  //                 metadata.meetingInviteStatus === MeetingInviteStatus.Cancel ||
  //                 metadata.meetingInviteStatus === MeetingInviteStatus.Declined
  //               ) {
  //                 clearTimeout(timeoudRef.current);
  //                 setMeetingId(undefined);
  //                 console.log('setMeetingId(undefined)');
  //               }
  //             }
  //           } catch (error: any) {
  //             console.warn(
  //               `AppointmentView::messagingSessionDidReceiveMessage::Failed to decode the message`,
  //               error,
  //             );
  //           }
  //         } else if (message.type === 'DELETE_CHANNEL') {
  //           const payload = JSON.parse(message.payload);
  //           if (payload.ChannelArn !== callChannel?.summary.ChannelArn) {
  //             return;
  //           }
  //         }
  //       },
  //     };
  //     messagingSession.addObserver(observer);
  //   }
  //   return () => {
  //     messagingSession?.removeObserver(observer);
  //   };
  // }, [callChannel, messagingSession, clientId, accountType]);

  useEffect(() => {
    let observer: MessagingSessionObserver;
    if (messagingSession) {
      observer = {
        messagingSessionDidReceiveMessage: (message: Message) => {
          if (!callChannel) {
            return;
          }
          if (message.type === 'DELETE_CHANNEL') {
            console.log('DELETE_CHANNEL');
            const payload = JSON.parse(message.payload);
            if (payload.ChannelArn !== callChannel.summary.ChannelArn) {
              return;
            }
            console.log('here');
            // const senderUsername = payload.Sender.Arn.split('/user/')[1];
            // if (message.headers['x-amz-chime-message-type'] === 'CONTROL') {
            //   let content = decodeURIComponent(payload.Content);
            //   if (content === 'ping') {
            //     presenceMap.current[senderUsername] = Date.now();
            //   }
            //   return;
            // }
            try {
              // const metadata = JSON.parse(payload.Metadata) as MessageMetadata;

              clearTimeout(timeoudRef.current);
              setMeetingId(undefined);
              console.log('setMeetingId(undefined)');
            } catch (error: any) {}
          }
        },
      };
      messagingSession.addObserver(observer);
    }
    return () => {
      messagingSession?.removeObserver(observer);
    };
  }, [callChannel, messagingSession, clientId, accountType]);

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

  const value: CallValue = {
    createCall,
    callChannel,
    deleteCall,
    meetingInviteStatus,
    joinInfo,
    meetingId,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}
