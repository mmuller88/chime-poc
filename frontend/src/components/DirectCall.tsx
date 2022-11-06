import {
  ListUsersInGroupCommand,
  UserType,
} from '@aws-sdk/client-cognito-identity-provider';
import { useCallback, useEffect, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';

import { useAuth } from '../providers/AuthProvider';
import { useAwsClient } from '../providers/AwsClientProvider';
// import { useRoute } from '../providers/RouteProvider';
import { CognitoUser } from '../types';
// import Chat from './Chat';
import './DirectCall.css';

// import Config from '../utils/Config';
import { useTranslation } from 'react-i18next';
import useMountedRef from '../hooks/useMountedRef';
import { useRuntime } from '../providers/RuntimeProvider';

import { Message, MessagingSessionObserver } from 'amazon-chime-sdk-js';
import { useCall } from '../providers/CallProvider';
import { useMessaging } from '../providers/MessagingProvider';

// const REFRESH_INTERVAL = 1000;
// const RETRIES = 1;
// let timeoutId: ReturnType<typeof setTimeout>;

export default function DirectCall(): JSX.Element {
  // const { setRoute } = useRoute();
  const { patientUserPoolGroupName, cognitoUserPoolId } = useRuntime();
  const { cognitoClient, lambdaClient } = useAwsClient();
  const { user } = useAuth();
  const [patients, setPatients] = useState<CognitoUser[]>([]);
  const [selectedPatientUsername, setSelectedPatientUsername] =
    useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const mountedRef = useMountedRef();
  const { t } = useTranslation();
  const { messagingSession } = useMessaging();
  const { createCall } = useCall();

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

  const onChangePatient = useCallback(
    (event) => {
      console.log('onChangePatient');
      setSelectedPatientUsername(event.target.value);
      console.log(event.target.value);
    },
    [setSelectedPatientUsername],
  );

  const onClickCall = useCallback(async () => {
    setLoading(true);
    const patient = patients.find(
      (patient: CognitoUser) => patient.username === selectedPatientUsername,
    );
    if (!patient) {
      throw new Error(`Patient ${selectedPatientUsername} does not exist.`);
    }

    await createCall({
      caller: user.username!,
      recipient: patient.username,
    });

    setLoading(false);

    let observer: MessagingSessionObserver;
    if (messagingSession) {
      observer = {
        messagingSessionDidReceiveMessage: (message: Message) => {
          if (
            message.type === 'CREATE_CHANNEL_MEMBERSHIP' ||
            message.type === 'DELETE_CHANNEL' ||
            message.type === 'UPDATE_CHANNEL'
          ) {
            // refreshChannels();
          }
        },
      };
      messagingSession.addObserver(observer);
      // currentRetry = RETRIES;
      // refreshChannels();
    }
    return () => {
      messagingSession?.removeObserver(observer);
    };
  }, [lambdaClient, patients, selectedPatientUsername, user]);

  // const onCleanUpDoctor = useCallback(async () => {
  //   console.log('onCleanUpDoctor');

  //   // await deleteCall();
  // }, [callChannel]);

  // const onCleanUpPatient = useCallback(() => {
  //   if (meetingId) {
  //     cleanedUpMeetingIdsRef.current.add(meetingId);
  //     setMeetingId(undefined);
  //   }
  // }, [meetingId]);

  return (
    <div className="DirectCall">
      <form className="DirectCall__form">
        <div className="DirectCall__selectContainer">
          <label>Patient</label>
          <div className="DirectCall__selectAndArrow">
            <select
              className="DirectCall__select"
              value={selectedPatientUsername}
              onChange={onChangePatient}
            >
              <option value={''}>Choose your patient</option>
              {patients?.map((patient) => (
                <option key={patient.username} value={patient.username}>
                  {`${patient.attributes.name}`}
                </option>
              ))}
            </select>
            <div className="DirectCall__selectArrow">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16.59 8.58984L12 13.1698L7.41 8.58984L6 9.99984L12 15.9998L18 9.99984L16.59 8.58984Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
          </div>
        </div>
        <button
          className="AppointmentView__callButton"
          onClick={onClickCall}
          disabled={!selectedPatientUsername || loading}
        >
          {t('AppointmentView.call')}
        </button>
      </form>
      {
        <>
          {/* {channel && <Chat channel={channel} />} */}
          {/* <CallView
            number={number}
            isCaller={accountType === AccountType.Doctor}
          /> */}
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
