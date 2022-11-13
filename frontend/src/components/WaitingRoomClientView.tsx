import { useCallback, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';

import { useAuth } from '../providers/AuthProvider';
// import { useAwsClient } from '../providers/AwsClientProvider';
import './DirectCall.css';

// import Config from '../utils/Config';

import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { t } from 'i18next';
import { AccountType } from '../constants';
import {
  TranslationQueue,
  useCreateTranslationMessageMutation,
  useDeleteTranslationMessageMutation,
  useListTranslationMessagesQuery,
} from '../lib/api';

export default function WaitingRoomClientView(): JSX.Element {
  const { user, appInstanceUserArn, accountType } = useAuth();
  const [selectedTranslation, setSelectedTranslation] = useState<
    TranslationQueue | undefined
  >(undefined);

  const { data, isLoading, refetch } = useListTranslationMessagesQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
    },
  );
  data?.listTranslationMessages?.items?.sort(
    (e1, e2) => Date.parse(e1?.createdAt!) - Date.parse(e2?.createdAt!),
  );

  // const updateMutation = useUpdateTranslationMessageMutation();
  const createMutation = useCreateTranslationMessageMutation();
  const deleteMutation = useDeleteTranslationMessageMutation();

  dayjs.extend(localizedFormat);

  const onClickWait = useCallback(async () => {
    // setLoading(true);
    console.log('onClickWait');

    if (!user.username || !selectedTranslation) {
      return;
    }

    await createMutation.mutateAsync({
      input: {
        username: user.username,
        client: {
          name: user.attributes?.name,
          email: user.attributes?.email,
          phone: user.attributes?.phone_number,
        },
        translationQueue: selectedTranslation,
      },
    });

    await refetch();
  }, [user, selectedTranslation]);

  const onClickJoin = useCallback(async () => {
    console.log('onClickJoin');
  }, [user]);

  const onChangeTranslation = useCallback(
    (event) => {
      console.log('onChangeTranslation');
      console.log(`value=${event.target.value}`);
      setSelectedTranslation(event.target.value);
      console.log(event.target.value);
    },
    [setSelectedTranslation],
  );

  const onClickLeave = useCallback(
    ({
      translationQueue,
      createdAt,
    }: {
      translationQueue: TranslationQueue;
      createdAt: string;
    }) => {
      (async () => {
        await deleteMutation.mutateAsync({
          input: {
            translationQueue: translationQueue,
            createdAt: createdAt,
          },
        });
        await refetch();
      })();
    },
    [appInstanceUserArn],
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="DirectCall">
      <div className="DirectCall__form">
        {
          accountType === AccountType.Patient && (
            // data?.listTranslationMessages?.items?.length === 0 && (
            <>
              <button
                className="AppointmentView__callButton"
                onClick={onClickWait}
              >
                Wait
              </button>
              <div className="DirectCall__selectContainer">
                <label>Translation</label>
                <div className="DirectCall__selectAndArrow">
                  <select
                    className="DirectCall__select"
                    value={selectedTranslation}
                    onChange={onChangeTranslation}
                  >
                    <option value={''}>Choose your translation</option>
                    {[TranslationQueue.EngGer, TranslationQueue.EngPt]?.map(
                      (translation) => (
                        <option key={translation} value={translation}>
                          {`${translation}`}
                        </option>
                      ),
                    )}
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
            </>
          )
          // )
        }
        {accountType === AccountType.Doctor && (
          <>
            <button
              className="AppointmentView__callButton"
              onClick={onClickJoin}
            >
              Join
            </button>
          </>
        )}
        {/* <CallView
          number={number}
          isCaller={accountType === AccountType.Patient}
        /> */}
        <div className="flex overflow-y-scroll flex-col flex-[1_0_0%] pb-4">
          <ul className="">
            {data?.listTranslationMessages?.items?.map((message) =>
              !message ? (
                <></>
              ) : (
                <li
                  className="bg-white border-2 rounded m-4 p-4 ease-linear duration-75 shadow-[0_4px_12px_rgb(141,153,155,0.2)]"
                  key={message.id}
                >
                  {' '}
                  <div className="">
                    <div className="">
                      {'Translation: ' + message.translationQueue}
                    </div>
                    <div className="">{'Client: ' + message.client.name}</div>
                    <div className="flex pt-4 border-t-2 ">
                      <div className="flex-[1_1_55%]">
                        <span className="mr-2">{'📅'}</span>
                        <span>
                          {dayjs(message.createdAt).calendar(null, {
                            sameDay: t('AppointmentList.dayJsSameDayFormat'),
                            nextDay: t('AppointmentList.dayJsNextDayFormat'),
                            nextWeek: 'L',
                            lastDay: 'L',
                            lastWeek: 'L',
                            sameElse: 'L',
                          })}
                        </span>
                      </div>
                      <div className="flex-[1_1_45%]">
                        <span className="mr-2">{'🕑'}</span>
                        <span>{dayjs(message.createdAt).format('LT')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <button
                      className=" text-primary"
                      onClick={() => {
                        onClickLeave({
                          translationQueue: message.translationQueue,
                          createdAt: message.createdAt,
                        });
                      }}
                    >
                      Leave
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
