import { setItem } from "../utils/MMKV_STORAGE/mmkvStorage";

export const storeUserToken = async (token: string) => {
  await setItem("UserToken", token);
  console.log("UserToken stored successfully...");
}