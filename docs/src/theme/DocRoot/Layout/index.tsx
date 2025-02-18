import React, {type ReactNode, useEffect, useState} from 'react';
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import BackToTopButton from '@theme/BackToTopButton';
import DocRootLayoutSidebar from '@theme/DocRoot/Layout/Sidebar';
import DocRootLayoutMain from '@theme/DocRoot/Layout/Main';
import type {Props} from '@theme/DocRoot/Layout';
import { initOpenReplay, startOpenReplayTracking } from '@site/src/components/OpenReplay/OpenReplay';

import styles from './styles.module.css';
import useIsBrowser from '@docusaurus/useIsBrowser';

export default function DocRootLayout({children}: Props): ReactNode {
  const sidebar = useDocsSidebar();
  const [hasInitializedOpenReplay, setHasInitializedOpenReplay] = useState(false);
  const isBrowser = useIsBrowser();
  const [hasInitialized, setHasInitialized] = useState(false);
  const [hiddenSidebarContainer, setHiddenSidebarContainer] = useState(false);


  useEffect(() => {
    if (isBrowser && !hasInitialized) {
      (async () => {
        try {
          await initOpenReplay();
          setHasInitializedOpenReplay(true);
        } catch (error) {
          console.error('Failed to initialize OpenReplay:', error);
        }
      })();

      setHasInitialized(true);
    }
  }, [isBrowser, hasInitialized]);

  useEffect(() => {
    if (isBrowser && hasInitializedOpenReplay && window.location.hostname !== 'localhost') {
      startOpenReplayTracking();
    }
  }, [hasInitializedOpenReplay]);


  return (
    <div className={styles.docsWrapper}>
      <BackToTopButton />
      <div className={styles.docRoot}>
        {sidebar && (
          <DocRootLayoutSidebar
            sidebar={sidebar.items}
            hiddenSidebarContainer={hiddenSidebarContainer}
            setHiddenSidebarContainer={setHiddenSidebarContainer}
          />
        )}
        <DocRootLayoutMain hiddenSidebarContainer={hiddenSidebarContainer}>
          {children}
        </DocRootLayoutMain>
      </div>
    </div>
  );
}
