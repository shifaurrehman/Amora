import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import MainNavigation from './navigation/MainNavigator/MainNavigation';
import { Provider } from 'react-redux';
import store, { persistor } from './redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import { supabase } from './lib/supabase';

const App = () => {
  useEffect(() => {
    const updateAuthRefresh = (state: string | null) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    updateAuthRefresh(AppState.currentState);
    const subscription = AppState.addEventListener('change', updateAuthRefresh);
    return () => {
      subscription.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>
        <MainNavigation />
      </PersistGate>
    </Provider>
  )
}

export default App