import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();

// function to set a value in storage
export const setItem = (key: string, value: any) => {
  storage.set(key, value);
}

// function to get a value from storage
export const getItem = (key: string) => {
  return storage.getString(key);
}

// function to remove a value from storage
export const removeItem = (key: string) => {    
  storage.delete(key);
}