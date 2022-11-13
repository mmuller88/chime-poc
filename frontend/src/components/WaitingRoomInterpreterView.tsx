import { useCallback, useEffect } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import Observable from 'zen-observable';

// import { useAuth } from '../providers/AuthProvider';
// import { useAwsClient } from '../providers/AwsClientProvider';
import './DirectCall.css';

// import Config from '../utils/Config';

import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { t } from 'i18next';
import {
  onCreateTranslationMessage,
  onDeleteTranslationMessage,
} from '../graphql/subscriptions';
import {
  CreateTranslationMessageInput,
  DeleteTranslationMessageInput,
  ModelSortDirection,
  TranslationQueue,
  useListTranslationMessagesQuery,
} from '../lib/api';
import { API } from '../lib/fetcher';
import { useAuth } from '../providers/AuthProvider';
import { useCall } from '../providers/CallProvider';

export default function WaitingRoomInterpreterView(): JSX.Element {
  const { user } = useAuth();
  const { createCall } = useCall();

  const engGerQueue = useListTranslationMessagesQuery(
    {
      translationQueue: TranslationQueue.EngGer,
      sortDirection: ModelSortDirection.Asc,
    },
    {
      refetchOnWindowFocus: false,
    },
  );

  const engPtQueue = useListTranslationMessagesQuery(
    {
      translationQueue: TranslationQueue.EngPt,
      sortDirection: ModelSortDirection.Asc,
    },
    {
      refetchOnWindowFocus: false,
    },
  );

  const translationQueues = [
    { name: 'English German Queue', queue: engGerQueue },
    { name: 'English Portuguese Queue', queue: engPtQueue },
  ];

  useEffect(() => {
    (async () => {
      const createSub = (await API.getInstance().query(
        onCreateTranslationMessage,
      )) as Observable<CreateTranslationMessageInput>;
      createSub.subscribe({
        next: async (message) => {
          console.log('createSub fired');
          console.log(message);
          // await engGerQueue.refetch();
          // await engPtQueue.refetch();
          Promise.all(
            translationQueues.map(
              async (translationQueue) =>
                await translationQueue.queue.refetch(),
            ),
          );
        },
        error: (error) => console.warn(error),
      });
      const deleteSub = (await API.getInstance().query(
        onDeleteTranslationMessage,
      )) as Observable<DeleteTranslationMessageInput>;
      deleteSub.subscribe({
        next: async (message) => {
          console.log('deleteSub fired');
          console.log(message);
          // await engGerQueue.refetch();
          // await engPtQueue.refetch();
          Promise.all(
            translationQueues.map(
              async (translationQueue) =>
                await translationQueue.queue.refetch(),
            ),
          );
        },
        error: (error) => console.warn(error),
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translationQueues]);

  // const deleteMutation = useDeleteTranslationMessageMutation();

  dayjs.extend(localizedFormat);

  const onClickCall = useCallback(async (operator: string) => {
    console.log('onClickCall');
    await createCall({ caller: user.username!, recipient: operator });
  }, []);

  if (engGerQueue.isLoading || engPtQueue.isLoading)
    return <div>Loading...</div>;

  return (
    <div className="DirectCall">
      {[
        { name: 'English Germany Queue', queue: engGerQueue },
        { name: 'English Portuguese Queue', queue: engPtQueue },
      ].map((translationQueue) => (
        <div className="AppointmentList__listContainer">
          {translationQueue.name}
          <ul className="AppointmentList__list">
            {translationQueue.queue.data?.listTranslationMessages?.items?.map(
              (message) =>
                !message ? (
                  <></>
                ) : (
                  <li className="AppointmentList__listItem" key={message.id}>
                    <div className="AppointmentList__nameContainer">
                      <div className="AppointmentList__name">
                        {'Translation: ' + message.translationQueue}
                      </div>
                      <div className="AppointmentList__name">
                        {'Operator: ' + message.operator.name}
                      </div>
                      <div className="AppointmentList__dateTime">
                        <div className="AppointmentList__date">
                          <span className="AppointmentList__icon">{'📅'}</span>
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
                        <div className="AppointmentList__time">
                          <span className="AppointmentList__icon">{'🕑'}</span>
                          <span>{dayjs(message.createdAt).format('LT')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="AppointmentList__buttonContainer">
                      <button
                        className="AppointmentView__callButton"
                        onClick={() => onClickCall(message.username)}
                      >
                        Call
                      </button>
                    </div>
                  </li>
                ),
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
