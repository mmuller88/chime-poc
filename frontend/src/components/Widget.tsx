import { useAuthenticator } from '@aws-amplify/ui-react';
import {
  lightTheme,
  PopOver,
  PopOverItem,
} from 'amazon-chime-sdk-component-library-react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from 'styled-components';

import './Widget.css';
import Window from './Window';

export default function Widget({
  children,
  number,
  title,
}: {
  children: ReactNode;
  number?: number;
  title?: string;
}): JSX.Element {
  const { user, signOut } = useAuthenticator();
  const { t } = useTranslation();
  return (
    <ThemeProvider theme={lightTheme}>
      <Window
        className="Widget__window"
        title={`${title ? title + ' ' : ''}${t('Widget.title')}`}
        number={number}
        rightNode={
          user ? (
            <PopOver
              className="Widget__popOver"
              a11yLabel="Menu"
              renderButton={() => <>•••</>}
              placement="bottom-end"
            >
              <PopOverItem
                as="button"
                onClick={signOut}
                children={<span>{t('Widget.signOut')}</span>}
              />
            </PopOver>
          ) : undefined
        }
      >
        {children}
      </Window>
    </ThemeProvider>
  );
}
