import { ImageSourcePropType } from 'react-native';

interface Stats {
  followers: string;
  following: string;
  posts: string;
}

export interface User {
  id: number;
  name: string;
  age: number;
  occupation?: string;
  address?: string;
  image: ImageSourcePropType;
  distance?: string;
  about?: string;
  interests: string[];
  religion?: string;
  languages: string[];
  sect?: string;
  education?: string;
  location?: string;
  height?: string;
  weight?: string;
  employementstatus?: string;
  meritalstatus?: string;
  images: ImageSourcePropType[];
  stats: Stats;
}


interface dummyRemainingData {
  id:number;
  image:ImageSourcePropType;
  distance:string;
  images:ImageSourcePropType[];
  about:string;
}
export const Users: dummyRemainingData[] = [
  {
    id: 1,
    image: require('../assets/images/persons/person1.jpeg'),
  distance: '36 miles away',
    about: 'Passionate about food and cooking...',
      images: [
        require('../assets/images/persons/person1.jpeg'),
        require('../assets/images/persons/person2.jpeg'),
        require('../assets/images/persons/person3.jpeg'),
      ],
  },
  {
    id: 2,
    image: require('../assets/images/persons/person2.jpeg'),
  distance: '36 miles away',
    about: 'Passionate about food and cooking...',
      images: [
        require('../assets/images/persons/person3.jpeg'),
        require('../assets/images/persons/person4.jpeg'),
        require('../assets/images/persons/person5.jpeg'),
      ],
  },
  {
    id: 3,
    image: require('../assets/images/persons/person3.jpeg'),
  distance: '16 miles away',
    about: 'Passionate about food and cooking...',
      images: [
        require('../assets/images/persons/person5.jpeg'),
        require('../assets/images/persons/person6.jpeg'),
        require('../assets/images/persons/person7.jpeg'),
      ],
  },
  {
    id: 4,
    image: require('../assets/images/persons/person4.jpeg'),
  distance: '20 miles away',
    about: 'Passionate about food and cooking...',
      images: [
        require('../assets/images/persons/person7.jpeg'),
        require('../assets/images/persons/person8.jpeg'),
        require('../assets/images/persons/person9.jpeg'),
      ],
  },
  {
    id: 5,
    image: require('../assets/images/persons/person5.jpeg'),
  distance: '45 miles away',
    about: 'Passionate about food and cooking...',
      images: [
        require('../assets/images/persons/person8.jpeg'),
        require('../assets/images/persons/person10.jpeg'),
        require('../assets/images/persons/person11.jpeg'),
      ],
  },
  {
    id: 6,
    image: require('../assets/images/persons/person6.jpeg'),
  distance: '8 miles away',
    about: 'Passionate about food and cooking...',
      images: [
        require('../assets/images/persons/person11.jpeg'),
        require('../assets/images/persons/person12.jpeg'),
        require('../assets/images/persons/person13.jpeg'),
      ],
  },
  {
    id: 7,
    image: require('../assets/images/persons/person7.jpeg'),
  distance: '9 miles away',
    about: 'Passionate about food and cooking...',
      images: [
        require('../assets/images/persons/person13.jpeg'),
        require('../assets/images/persons/person14.jpeg'),
        require('../assets/images/persons/person15.jpeg'),
      ],
  },
  {
    id: 8,
    image: require('../assets/images/persons/person8.jpeg'),
  distance: '19 miles away',
    about: 'Passionate about food and cooking...',
      images: [
        require('../assets/images/persons/person15.jpeg'),
        require('../assets/images/persons/person1.jpeg'),
        require('../assets/images/persons/person2.jpeg'),
      ],
  },
  {
    id: 9,
    image: require('../assets/images/persons/person9.jpeg'),
  distance: '24 miles away',
    about: 'Passionate about food and cooking...',
      images: [
        require('../assets/images/persons/person2.jpeg'),
        require('../assets/images/persons/person3.jpeg'),
        require('../assets/images/persons/person4.jpeg'),
      ],
  },
  {
    id: 10,
    image: require('../assets/images/persons/person10.jpeg'),
  distance: '51 miles away',
    about: 'Passionate about food and cooking...',
      images: [
        require('../assets/images/persons/person4.jpeg'),
        require('../assets/images/persons/person5.jpeg'),
        require('../assets/images/persons/person6.jpeg'),
      ],
  },
  {
    id: 11,
    image: require('../assets/images/persons/person11.jpeg'),
  distance: '68 miles away',
    about: 'Passionate about food and cooking...',
      images: [
        require('../assets/images/persons/person6.jpeg'),
        require('../assets/images/persons/person7.jpeg'),
        require('../assets/images/persons/person8.jpeg'),
      ],
  },
  {
    id: 12,
    image: require('../assets/images/persons/person12.jpeg'),
  distance: '13 miles away',
    about: 'Passionate about food and cooking...',
      images: [
        require('../assets/images/persons/person8.jpeg'),
        require('../assets/images/persons/person9.jpeg'),
        require('../assets/images/persons/person10.jpeg'),
      ],
  },
  {
    id: 13,
    image: require('../assets/images/persons/person13.jpeg'),
  distance: '34 miles away',
    about: 'Passionate about food and cooking...',
      images: [
        require('../assets/images/persons/person10.jpeg'),
        require('../assets/images/persons/person11.jpeg'),
        require('../assets/images/persons/person12.jpeg'),
      ],
  },
  {
    id: 14,
    image: require('../assets/images/persons/person14.jpeg'),
  distance: '11 miles away',
    about: 'Passionate about food and cooking...',
      images: [
        require('../assets/images/persons/person12.jpeg'),
        require('../assets/images/persons/person13.jpeg'),
        require('../assets/images/persons/person14.jpeg'),
      ],
  },
  {
    id: 15,
    image: require('../assets/images/persons/person15.jpeg'),
  distance: '4 miles away',
    about: 'Passionate about food and cooking...',
      images: [
        require('../assets/images/persons/person14.jpeg'),
        require('../assets/images/persons/person15.jpeg'),
        require('../assets/images/persons/person1.jpeg'),
      ],
  },
];
