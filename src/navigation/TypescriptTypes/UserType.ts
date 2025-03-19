
interface ImageType {
    uri?: string;
    type?: string;
    fileName?: string;
  }
  
  
  interface LanguageType {
    id?: number;
    name?: string;
  }

export type UserProfileType = {
  about?: string;
  age?: string;
  city?: string;
  createdAt?: string;
  dateOfBirth?: string;
  education?: string;
  employmentStatus?: string;
  extraimages?: ImageType[];
  gender?: string;
  height?: string;
  hobbies?: string;
  id?: string;
  languages?: LanguageType[];
  maritalStatus?: string;
  name?: string;
  profession?: string;
  profileImage?: ImageType;
  religion?: string;
  sect?: string;
  userId?: string;
  weight?: string;
};
