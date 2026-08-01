import { UserRole } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export type AuthenticatedUser = {
  userId: string;
  email: string;
  role: UserRole;
};

export type LoginResponse = {
  accessToken: string;
};
