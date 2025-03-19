//*********   SAGA AND PERSIST REDUX STORE    ********\\
import { configureStore } from "@reduxjs/toolkit";
import favoritesReducer from './favoriteSlice';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistReducer,  persistStore } from 'redux-persist';
import createSagaMiddleware from 'redux-saga';
import authReducer from './authSlice';
import filterReducer from './FilteredUsersSlice'
import profileReducer from './profileSlice';
import { watchAuthSaga } from "./saga/authSaga";
import { ProfileSaga } from "./saga/ProfileSaga";
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
        auth: authReducer,
        profile:profileReducer,
        favorites: persisitedFavoriteReducer,
        filteredUsers: filterReducer,

    },
    middleware:(getDefaultMiddleware)=> getDefaultMiddleware({
        serializableCheck:false
    }).concat(sagaMiddleware)
})

sagaMiddleware.run(watchAuthSaga);
sagaMiddleware.run(ProfileSaga);
sagaMiddleware.run(FilteredUsersSaga);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;