import { useCallback } from 'react';
import 'react-datepicker/dist/react-datepicker.css';

// import { useAuth } from '../providers/AuthProvider';
// import { useAwsClient } from '../providers/AwsClientProvider';
import './DirectCall.css';

// import Config from '../utils/Config';

import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { t } from 'i18next';
import { TranslationQueue, useListTranslationMessagesQuery } from '../lib/api';

export default function WaitingRoomInterpreterView(): JSX.Element {
  // const { user } = useAuth();

  const engGerQueue = useListTranslationMessagesQuery(
    { filter: { sortKey: { beginsWith: TranslationQueue.EngGer } } },
    {
      refetchOnWindowFocus: false,
    },
  );

  const engPtQueue = useListTranslationMessagesQuery(
    { filter: { sortKey: { beginsWith: TranslationQueue.EngPt } } },
    {
      refetchOnWindowFocus: false,
    },
  );

  // const deleteMutation = useDeleteTranslationMessageMutation();

  dayjs.extend(localizedFormat);

  const onClickCall = useCallback(() => {
    console.log('onClickCall');
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
                        {'Translation: ' +
                          message.sortKey.substring(
                            0,
                            message.sortKey.indexOf('#'),
                          )}
                      </div>
                      <div className="AppointmentList__name">
                        {'Operator: ' + message.interpreter.name}
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
                        onClick={onClickCall}
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
