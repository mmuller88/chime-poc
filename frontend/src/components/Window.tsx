import classnames from 'classnames';
import { ReactNode, useMemo, useRef } from 'react';
import Draggable from 'react-draggable';
import { v4 as uuidv4 } from 'uuid';

import { createPortal } from 'react-dom';
import './Window.css';

export default function Window({
  children,
  className,
  isPortal = false,
  rightNode,
  title,
  number = 1,
}: {
  children: ReactNode;
  className?: string;
  isPortal?: boolean;
  rightNode?: ReactNode;
  title: string;
  number?: number;
}): JSX.Element {
  const id = useMemo(() => uuidv4(), []);
  const ref = useRef(null);

  const node = (
    <Draggable
      position={{ x: (number - 1) * 320, y: 0 }}
      nodeRef={ref}
      handle={`.Window__title--${id}`}
    >
      <div className={classnames('Window', className)} ref={ref}>
        <header className="Window__header">
          <h1 className={`Window__title Window__title--${id}`}>{title}</h1>
          {rightNode}
        </header>
        <main className="Window__main">{children}</main>
      </div>
    </Draggable>
  );

  if (isPortal) {
    return createPortal(
      node,
      document.getElementById('amazon-chime-sdk-widget-container') as Element,
    );
  } else {
    return node;
  }
}
