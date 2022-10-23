import {
  ListUsersInGroupCommand,
  UserType,
} from '@aws-sdk/client-cognito-identity-provider';
import { useCallback, useEffect, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';

import { useAuth } from '../providers/AuthProvider';
import { useAwsClient } from '../providers/AwsClientProvider';
import { useRoute } from '../providers/RouteProvider';
import { CognitoUser } from '../types';
import './DirectCall.css';
// import Config from '../utils/Config';
import useMountedRef from '../hooks/useMountedRef';
import { useRuntime } from '../providers/RuntimeProvider';

export default function DirectCall(): JSX.Element {
  const {
    patientUserPoolGroupName,
    cognitoUserPoolId,
    // createAppointmentFunctionArn,
  } = useRuntime();
  const { cognitoClient, lambdaClient } = useAwsClient();
  const { user } = useAuth();
  // const [startDate, setStartDate] = useState(new Date());
  const [patients, setPatients] = useState<CognitoUser[]>([]);
  const [selectedPatientUsername, setSelectedPatientUsername] =
    useState<string>('');
  const { setRoute } = useRoute();
  const [loading, setLoading] = useState<boolean>(false);
  const mountedRef = useMountedRef();
  // For doctor view
  // const [showMeetingDoctorView, setShowMeetingDoctorView] = useState(false);

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

        /**
         * Convert
         * Array: [{ Name: 'hello', value: 'example@email.com' }, { Name: 'email', value: 'example@email.com' }]
         * to
         * Object: { username: 'hello', email: 'example@email.com' }
         */
        setPatients(
          users.map<CognitoUser>((user: UserType) => {
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
      setSelectedPatientUsername(event.target.value);
    },
    [setSelectedPatientUsername],
  );

  // const onClickCall = useCallback(() => {
  //   setShowMeetingDoctorView(true);
  // }, []);

  const onSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      try {
        setLoading(true);
        const patient = patients.find(
          (patient: CognitoUser) =>
            patient.username === selectedPatientUsername,
        );
        if (!patient) {
          throw new Error(`Patient ${selectedPatientUsername} does not exist.`);
        }
        // await lambdaClient.send(
        //   new InvokeCommand({
        //     FunctionName: createAppointmentFunctionArn,
        //     InvocationType: InvocationType.RequestResponse,
        //     LogType: LogType.None,
        //     Payload: new TextEncoder().encode(
        //       JSON.stringify({
        //         doctorUsername: user.username,
        //         patientUsername: patient.username,
        //         timestamp: dayjs(startDate)
        //           .second(0)
        //           .millisecond(0)
        //           .toISOString(),
        //       } as CreateAppointmentFunctionEvent),
        //     ),
        //   }),
        // );
        setRoute('AppointmentList');
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    },
    [
      lambdaClient,
      patients,
      selectedPatientUsername,
      setRoute,
      // startDate,
      user,
    ],
  );

  // const now = new Date();

  return (
    <div className="DirectCall">
      <form className="DirectCall__form" onSubmit={onSubmit}>
        {/* <div className="DirectCall__dateContainer">
          <label>Date and time</label>
          <DatePicker
            selected={startDate}
            onChange={(date: Date) => setStartDate(date)}
            showTimeSelect
            timeFormat="h:mm aa"
            timeIntervals={5}
            minDate={now}
            maxDate={dayjs(now).add(3, 'month').toDate()}
            dateFormat="MMMM d, yyyy h:mm aa"
            portalId="amazon-chime-sdk-date-picker"
          />
        </div> */}
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
        <div className="DirectCall__buttonContainer">
          <button
            type="submit"
            className="DirectCall__button"
            disabled={!selectedPatientUsername || loading}
          >
            {'Call'}
          </button>
        </div>
      </form>
    </div>
  );
}
