export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
}

export type SafeUser = Omit<User, 'password'>;
