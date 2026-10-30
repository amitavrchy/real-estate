import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import type { User } from "@/lib/types";

const auth = createSlice({
  name: "auth",
  initialState: { user: null as User | null, ready: false },
  reducers: {
    session: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.ready = true;
    },
  },
});
const favorites = createSlice({
  name: "favorites",
  initialState: { ids: [] as string[] },
  reducers: {
    setFavorites: (state, action: PayloadAction<string[]>) => {
      state.ids = action.payload;
    },
    toggleFavorite: (state, action: PayloadAction<string>) => {
      state.ids = state.ids.includes(action.payload)
        ? state.ids.filter((id) => id !== action.payload)
        : [...state.ids, action.payload];
    },
  },
});
const ui = createSlice({
  name: "ui",
  initialState: { menu: false, command: false, toast: "" },
  reducers: {
    setMenu: (s, a: PayloadAction<boolean>) => {
      s.menu = a.payload;
    },
    setCommand: (s, a: PayloadAction<boolean>) => {
      s.command = a.payload;
    },
    notify: (s, a: PayloadAction<string>) => {
      s.toast = a.payload;
    },
  },
});
const searchUi = createSlice({
  name: "searchUi",
  initialState: { hoveredId: null as string | null, showMap: false },
  reducers: {
    hoverProperty: (s, a: PayloadAction<string | null>) => {
      s.hoveredId = a.payload;
    },
    setShowMap: (s, a: PayloadAction<boolean>) => {
      s.showMap = a.payload;
    },
  },
});
export const { session } = auth.actions;
export const { setFavorites, toggleFavorite } = favorites.actions;
export const { setMenu, setCommand, notify } = ui.actions;
export const { hoverProperty, setShowMap } = searchUi.actions;
export const makeStore = () =>
  configureStore({
    reducer: {
      auth: auth.reducer,
      favorites: favorites.reducer,
      ui: ui.reducer,
      searchUi: searchUi.reducer,
    },
  });
export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export const useAppDispatch = useDispatch.withTypes<AppStore["dispatch"]>();
export const useAppSelector = useSelector.withTypes<RootState>();
