import { z } from 'zod';
import { Role } from '../../../domain/enums/role.enum';

export const RegisterDto = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.nativeEnum(Role).optional().default(Role.USER),
});

export const LoginDto = z.object({
    email: z.string().email(),
    password: z.string(),
});

export type RegisterInput = z.infer<typeof RegisterDto>;
export type LoginInput = z.infer<typeof LoginDto>;
