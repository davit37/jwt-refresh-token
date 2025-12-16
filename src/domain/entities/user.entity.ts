import { Role } from '../enums/role.enum';

export interface User {
    id: string;
    email: string;
    password?: string; // Optional because we might return user without password
    role: Role;
    createdAt: Date;
}
