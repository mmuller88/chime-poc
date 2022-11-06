import { ChangeEvent, KeyboardEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import { AccountType } from '../constants';
import { useAuth } from '../providers/AuthProvider';
import { Channel, MessageWrapper } from '../types';
import './ChatInput.css';

export default function ChatInput({
  channel,
  onSubmitRequest,
}: {
  channel: Channel;
  onSubmitRequest: (messageWrapper: MessageWrapper) => void;
}): JSX.Element {
  const { accountType, appInstanceUserArn, user } = useAuth();
  const [value, setValue] = useState<string>('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();

  const onSubmit = async () => {
    if (value.trim() === '') {
      return;
    }
    const messageWrapper: MessageWrapper = {
      content: value.trim(),
      createdTimestamp: new Date(),
      // Assign a temporary ID. We will get an original message ID from
      // the SendChannelMessage API response in the ChatMessage component.
      messageId: uuidv4(),
      senderName: user.attributes!.name,
      senderArn: appInstanceUserArn,
      local: true,
    };
    setValue('');
    onSubmitRequest(messageWrapper);
  };

  const onChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setValue(event.target.value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div data-replicated-value={value} className="ChatInput">
      <textarea
        ref={ref}
        className="ChatInput__textArea"
        autoFocus
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={t('ChatInput.message', {
          recipient:
            accountType === AccountType.Doctor
              ? channel.recipient.name
              : channel.caller?.name ?? 'Unknown',
        })}
        value={value}
        rows={1}
        maxLength={512}
      />
    </div>
  );
}
