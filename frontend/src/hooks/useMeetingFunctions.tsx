import { InvocationType, InvokeCommand, LogType } from '@aws-sdk/client-lambda';
import { useCallback } from 'react';

import { useAwsClient } from '../providers/AwsClientProvider';
import { useRuntime } from '../providers/RuntimeProvider';
import { Channel, MeetingAPI, MeetingAPIResponse } from '../types';
import {
  CreateAttendeeFunctionEvent,
  CreateMeetingFunctionEvent,
} from '../types/lambda';

export default function useMeetingFunctions(): MeetingAPI {
  const { createAttendeeFunctionArn, createMeetingFunctionArn } = useRuntime();
  const { lambdaClient } = useAwsClient();

  const createMeeting = useCallback(
    async (channel: Channel): Promise<MeetingAPIResponse> => {
      const meetingAPIResponse: MeetingAPIResponse = {
        Meeting: undefined,
        Attendee: undefined,
      };

      let nearestRegion: string = 'us-east-1';
      try {
        const response = await fetch(
          'https://nearest-media-region.l.chime.aws',
        );
        const body = await response.json();
        nearestRegion = body.region;
      } catch (error: any) {
        console.error(error);
      }

      try {
        const data = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: `${createMeetingFunctionArn}`,
            InvocationType: 'RequestResponse',
            LogType: 'None',
            Payload: new TextEncoder().encode(
              JSON.stringify({
                appInstanceUserId: channel.caller.username,
                channelArn: channel.summary.ChannelArn,
                mediaRegion: nearestRegion,
              } as CreateMeetingFunctionEvent),
            ),
          }),
        );
        const response = JSON.parse(new TextDecoder().decode(data.Payload));
        if (response.statusCode === 200) {
          const joinInfo = JSON.parse(response.body);
          meetingAPIResponse.Meeting = joinInfo.JoinInfo.Meeting;
          meetingAPIResponse.Attendee = joinInfo.JoinInfo.Attendee;
        }
      } catch (error) {
        console.error('Error creating meeting', error);
      }
      return meetingAPIResponse;
    },
    [lambdaClient],
  );

  const createAttendee = useCallback(
    async (
      channel: Channel,
      meetingId: string,
    ): Promise<MeetingAPIResponse> => {
      const meetingAPIResponse: MeetingAPIResponse = {
        Meeting: undefined,
        Attendee: undefined,
      };
      try {
        const data = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: createAttendeeFunctionArn,
            InvocationType: InvocationType.RequestResponse,
            LogType: LogType.None,
            Payload: new TextEncoder().encode(
              JSON.stringify({
                appInstanceUserId: channel.recipient.username,
                channelArn: channel.summary.ChannelArn,
                meetingId,
              } as CreateAttendeeFunctionEvent),
            ),
          }),
        );
        console.log(`meetingId=${meetingId}`);
        console.log(`channel=${JSON.stringify(channel)}`);
        const response = JSON.parse(new TextDecoder().decode(data.Payload));
        console.log(`createAttendee=${JSON.stringify(response)}`);
        if (response.statusCode === 200) {
          const joinInfo = JSON.parse(response.body);
          meetingAPIResponse.Meeting = joinInfo.JoinInfo.Meeting;
          meetingAPIResponse.Attendee = joinInfo.JoinInfo.Attendee;
        }
      } catch (error) {
        console.error('Error in invoking create attendee lambda', error);
      }
      return meetingAPIResponse;
    },
    [lambdaClient],
  );

  return {
    createMeeting,
    createAttendee,
  };
}
