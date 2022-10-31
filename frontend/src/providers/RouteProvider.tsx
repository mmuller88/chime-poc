import React, { ReactNode, useContext, useEffect, useState } from 'react';

type RouteName =
  | 'CreateAppointment'
  | 'AppointmentList'
  | 'AppointmentView'
  | 'WaitingRoom'
  | 'DirectCall';
type Routes = Record<RouteName, ReactNode>;

interface RouteProviderValue {
  setRoute: (
    routeName: RouteName,
    params?: Record<string, any>,
    backRouteName?: RouteName,
  ) => void;
  params: Record<string, any>;
  backRouteName?: RouteName;
}

const RouteProviderContext = React.createContext<
  RouteProviderValue | undefined
>(undefined);

export function useRoute(): RouteProviderValue {
  const value = useContext(RouteProviderContext);
  if (!value) {
    throw new Error('RouteProvider must be used within RouteProvider');
  }
  return value;
}

export default function RouteProvider({
  routes,
  defaultRoute,
}: {
  routes: Routes;
  defaultRoute?: React.ReactNode;
}) {
  const [routeInfo, setRouteInfo] = useState<{
    node: ReactNode;
    params?: Record<string, any>;
    backRouteName?: RouteName;
  }>({
    node: defaultRoute ?? routes.AppointmentList,
  });
  const value = {
    setRoute: (
      routeName: RouteName,
      params?: Record<string, any>,
      backRouteName?: RouteName,
    ) => {
      setRouteInfo({
        node: routes[routeName],
        params,
        backRouteName,
      });
    },
    params: routeInfo.params || {},
    backRouteName: routeInfo.backRouteName,
  };
  useEffect(() => {
    return () => {
      setRouteInfo({
        node: <></>,
      });
    };
  }, []);
  return (
    <RouteProviderContext.Provider value={value}>
      {routeInfo.node}
    </RouteProviderContext.Provider>
  );
}
