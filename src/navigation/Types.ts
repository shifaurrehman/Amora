import { UserProfileType } from "./TypescriptTypes/UserType";

// navigation/types.ts
export type RootStackParamList = {
    Splash: undefined;
    Login: undefined; 
    Signup: undefined;
    Otp: { email: string };  
    Home: undefined;     
    Details: {item:UserProfileType};
    Favorites:undefined;
    CreateProfile:{uid:string};
    ActiveChatScreen:{ data: UserProfileType ,id:string};
    VoiceMessageScreen:undefined;
  };
  

  export type RootTabParamList = {
    Dashboard: undefined;
    Explore: undefined;
    Profile: undefined;
    Chat: undefined;
  };