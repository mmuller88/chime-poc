import { useCallback, useEffect } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import Observable from 'zen-observable';

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

  const onClickCall = useCallback(async (client: string) => {
    console.log('onClickCall');
    await createCall({ caller: user.username!, recipient: client });
  }, []);

  if (engGerQueue.isLoading || engPtQueue.isLoading)
    return <div>Loading...</div>;

  return (
    <div className="DirectCall">
      {[
        { name: 'English Germany Queue', queue: engGerQueue },
        { name: 'English Portuguese Queue', queue: engPtQueue },
      ].map((translationQueue) => (
        <div className="flex overflow-y-scroll flex-col flex-[1_0_0%] pb-4">
          {translationQueue.name}
          <ul className="">
            {translationQueue.queue.data?.listTranslationMessages?.items?.map(
              (message) =>
                !message ? (
                  <></>
                ) : (
                  <li
                    className="bg-white border-2 rounded m-4 p-4 ease-linear duration-75 shadow-[0_4px_12px_rgb(141,153,155,0.2)]"
                    key={message.id}
                  >
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
