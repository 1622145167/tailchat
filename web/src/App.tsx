import React, { Suspense } from 'react';
import {
  BrowserRouter,
  HashRouter,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';
import { TcProvider, useColorScheme, useLanguage } from 'tailchat-shared';
import clsx from 'clsx';
import { Loadable } from './components/Loadable';
import { ConfigProvider as AntdProvider } from 'antd';
import { Helmet } from 'react-helmet';
import { useRecordMeasure } from './utils/measure-helper';
import { getPopupContainer, preventDefault } from './utils/dom-helper';
import { LoadingSpinner } from './components/LoadingSpinner';
import { pluginRootRoute } from './plugin/common';
import { PortalHost as FallbackPortalHost } from './components/Portal';
import isElectron from 'is-electron';

const AppRouter: any = isElectron() ? HashRouter : BrowserRouter;

const MainRoute = Loadable(() => import('./routes/Main'));

const EntryRoute = Loadable(() => import('./routes/Entry'));

const PanelRoute = Loadable(() => import('./routes/Panel'));

const InviteRoute = Loadable(() => import('./routes/Invite'));

const AppProvider: React.FC = React.memo((props) => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AppRouter>
        <TcProvider>
          <AntdProvider getPopupContainer={getPopupContainer}>
            {props.children}
          </AntdProvider>
        </TcProvider>
      </AppRouter>
    </Suspense>
  );
});
AppProvider.displayName = 'AppProvider';

const AppContainer: React.FC = React.memo((props) => {
  const { isDarkMode, extraSchemeName } = useColorScheme();

  return (
    <div
      id="tailchat-app"
      className={clsx(
        'tailchat-app',
        'absolute inset-0 select-none overflow-hidden',
        {
          dark: isDarkMode,
        },
        extraSchemeName
      )}
      onContextMenu={preventDefault}
    >
      {props.children}
    </div>
  );
});
AppContainer.displayName = 'AppContainer';

const AppHeader: React.FC = React.memo(() => {
  const { language } = useLanguage();

  return (
    <Helmet>
      <meta httpEquiv="Content-Language" content={language} />
    </Helmet>
  );
});
AppHeader.displayName = 'AppHeader';

export const App: React.FC = React.memo(() => {
  useRecordMeasure('AppRenderStart');

  return (
    <AppProvider>
      <AppHeader />
      <AppContainer>
        <Switch>
          <Route path="/entry">
            <FallbackPortalHost>
              <EntryRoute />
            </FallbackPortalHost>
          </Route>
          <Route path="/main" component={MainRoute} />
          <Route path="/panel" component={PanelRoute} />
          <Route path="/invite/:inviteCode" component={InviteRoute} />
          <Route path="/plugin/*">
            <FallbackPortalHost>
              {/* NOTICE: Switch里不能出现动态路由 */}
              {pluginRootRoute.map((r, i) => (
                <Route
                  key={r.name}
                  path={r.path ? `/plugin${r.path}` : `/plugin/fallback${i}`}
                  component={r.component}
                />
              ))}
            </FallbackPortalHost>
          </Route>
          <Redirect to="/entry" />
        </Switch>
      </AppContainer>
    </AppProvider>
  );
});
App.displayName = 'App';
