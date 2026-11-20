//*********   SAGA AND PERSIST REDUX STORE    ********\\
import { configureStore } from "@reduxjs/toolkit";
import favoritesReducer from './favoriteSlice';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistReducer,  persistStore } from 'redux-persist';
import createSagaMiddleware from 'redux-saga';
import filterReducer from './FilteredUsersSlice'
import { FilteredUsersSaga } from "./saga/FilteredUsersSaga";

const sagaMiddleware = createSagaMiddleware();

// Redux Persist Configuration
const persistConfig = ({
    key : "root",
    storage: AsyncStorage,
    whitelist:['favorites'],
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

export default store;