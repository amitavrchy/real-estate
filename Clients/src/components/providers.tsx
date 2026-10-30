"use client";
import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { domAnimation, LazyMotion, MotionConfig } from "framer-motion";
import { get } from "@/lib/api";
import type { User } from "@/lib/types";
import {
  makeStore,
  notify,
  session,
  setFavorites,
  useAppDispatch,
  useAppSelector,
} from "@/store";

function SessionSync({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const user = useAppSelector((s) => s.auth.user);
  useEffect(() => {
    const scopes: Record<string, string[]> = {
      properties: ["properties", "property", "dashboard", "market", "agents"],
      favorites: ["favorites"],
      collections: ["collections", "collection"],
      inquiries: ["inquiries", "account-inquiries", "dashboard"],
      "saved-searches": ["saved-searches"],
      valuation: ["dashboard"],
      newsletter: ["dashboard"],
      journal: ["journal"],
      agents: ["reviews"],
    };
    const changed = (event: Event) => {
      const path = (event as CustomEvent<string>).detail;
      const keys = scopes[path?.split("/")[1]];
      if (keys)
        queryClient.invalidateQueries({
          predicate: (q) => keys.includes(String(q.queryKey[0])),
        });
    };
    window.addEventListener("haven-data-changed", changed);
    return () => window.removeEventListener("haven-data-changed", changed);
  }, [queryClient]);
  useEffect(() => {
    const expired = () => {
      queryClient.clear();
      dispatch(session(null));
      dispatch(setFavorites([]));
      dispatch(
        notify(
          "Your session has ended. Sign in to pick up where you left off.",
        ),
      );
    };
    window.addEventListener("haven-session-expired", expired);
    return () => window.removeEventListener("haven-session-expired", expired);
  }, [dispatch, queryClient]);
  useEffect(() => {
    if (!sessionStorage.getItem("haven-token")) {
      dispatch(session(null));
      return;
    }
    get<User>("/auth/me")
      .then((user) => dispatch(session(user)))
      .catch(() => {
        sessionStorage.removeItem("haven-token");
        dispatch(session(null));
      });
  }, [dispatch]);
  const favorites = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: () => get<{ propertyId: string }[]>("/favorites"),
    enabled: !!user,
  });
  useEffect(() => {
    dispatch(setFavorites(favorites.data?.map((f) => f.propertyId) ?? []));
  }, [favorites.data, dispatch, user?.id]);
  return children;
}
export function Providers({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);
  const [serverState] = useState(() => store.getState());
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <Provider store={store} serverState={serverState}>
      <QueryClientProvider client={client}>
        <MotionConfig reducedMotion="user">
          <LazyMotion features={domAnimation} strict><SessionSync>{children}</SessionSync></LazyMotion>
        </MotionConfig>
      </QueryClientProvider>
    </Provider>
  );
}
