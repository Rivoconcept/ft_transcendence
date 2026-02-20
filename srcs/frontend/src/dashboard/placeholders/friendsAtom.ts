import { atom } from 'jotai';

interface Friend {
  id: number;
  name: string;
  online: boolean;
}

const generateFriends = (): Friend[] => {
  const friends: Friend[] = [];
  for (let i = 1; i <= 50; i++) {
    friends.push({
      id: i,
      name: `Friend${i}`,
      online: Math.random() < 0.5,
    });
  }
  return friends;
};

export const friendsAtom = atom<Friend[]>(generateFriends());