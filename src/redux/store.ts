//*********   SAGA AND PERSIST REDUX STORE    ********\\
import { configureStore } from "@reduxjs/toolkit";
import favoritesReducer from './favoriteSlice';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistReducer,  persistStore } from 'redux-persist';
import createSagaMiddleware from 'redux-saga';
import filterReducer from './FilteredUsersSlice'
import { FilteredUsersSaga } from "./saga/FilteredUsersSaga";
import { useDispatch } from "react-redux";

const sagaMiddleware = createSagaMiddleware();

// Redux Persist Configuration.
// Favorites are no longer persisted locally: Supabase is the source of truth
// and the list is reloaded per session (see favoriteThunks).
const persistConfig = ({
    key : "root",
    storage: AsyncStorage,
    whitelist:[],
})

const persisitedFavoriteReducer = persistReducer(persistConfig, favoritesReducer)

const store = configureStore({
    reducer: {
        favorites: persisitedFavoriteReducer,
        filteredUsers: filterReducer,

    },
    middleware:(getDefaultMiddleware)=> getDefaultMiddleware({
        serializableCheck:false
    }).concat(sagaMiddleware)
})

sagaMiddleware.run(FilteredUsersSaga);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed dispatch so components can dispatch thunks (favoriteThunks).
export const useAppDispatch: () => AppDispatch = useDispatch;

export default store;