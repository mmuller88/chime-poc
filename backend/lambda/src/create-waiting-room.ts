import {
  AssociateChannelFlowCommand,
  ChannelMode,
  ChannelPrivacy,
  ChimeSDKMessagingClient,
  CreateChannelCommand,
  DeleteChannelCommand,
} from '@aws-sdk/client-chime-sdk-messaging';
import {
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { v4 as uuidv4 } from 'uuid';

import { Presence } from '../../../frontend/src/constants';
import { ChannelMetadata, CognitoUser } from '../../../frontend/src/types';
import { CreateWaitingRoomFunctionEvent } from '../../../frontend/src/types/lambda';
import { getCognitoUser } from './utils';

const { APP_INSTANCE_ARN, AWS_REGION, CHANNEL_FLOW_ARN, COGNITO_USER_POOL_ID } =
  process.env;

const messagingClient = new ChimeSDKMessagingClient({ region: AWS_REGION });
const cognitoClient = new CognitoIdentityProviderClient({ region: AWS_REGION });

exports.handler = async (event: CreateWaitingRoomFunctionEvent) => {
  const { patientUsername } = event;
  const timestamp = new Date(event.timestamp);
  const appInstanceUserArn = `${APP_INSTANCE_ARN}/user/${patientUsername}`;
  let channelArn: string | undefined = undefined;

  try {
    const [patientData] = await Promise.all([
      cognitoClient.send(
        new AdminGetUserCommand({
          UserPoolId: COGNITO_USER_POOL_ID,
          Username: patientUsername,
        }),
      ),
    ]);

    const patient: CognitoUser = getCognitoUser(patientUsername, patientData);
    const metadata: ChannelMetadata = {
      type: 'waitingroom',
      appointmentTimestamp: timestamp,
      patient: {
        username: patient.username,
        name: patient.attributes.name,
        email: patient.attributes.email,
        phone: patient.attributes.phone_number,
      },
      presenceMap: {
        [patient.username]: {
          presence: Presence.Added,
          modifiedTimestamp: timestamp,
        },
      },
    };
    const channelName = uuidv4();
    const data = await messagingClient.send(
      new CreateChannelCommand({
        AppInstanceArn: APP_INSTANCE_ARN,
        ChimeBearer: appInstanceUserArn,
        Name: channelName,
        Metadata: JSON.stringify(metadata),
        Mode: ChannelMode.RESTRICTED,
        Privacy: ChannelPrivacy.PUBLIC,
      }),
    );
    channelArn = data.ChannelArn!;
    await messagingClient.send(
      new AssociateChannelFlowCommand({
        ChannelArn: channelArn,
        ChannelFlowArn: CHANNEL_FLOW_ARN,
        ChimeBearer: appInstanceUserArn,
      }),
    );
  } catch (error: any) {
    console.error(error);

    // Clean up failed resources
    try {
      if (channelArn) {
        console.error(`Deleting a channel (${channelArn})`);
        await messagingClient.send(
          new DeleteChannelCommand({
            ChannelArn: channelArn,
            ChimeBearer: appInstanceUserArn,
          }),
        );
      }
    } catch (error: any) {
      console.error(error);
    }
  }
};
