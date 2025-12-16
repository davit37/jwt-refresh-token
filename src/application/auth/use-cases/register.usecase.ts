import { UserRepository } from '../../../infrastructure/database/prisma/repositories/user.repository';
import { PasswordService } from '../../../infrastructure/security/password.service';
import { RegisterInput } from '../dtos/auth.dto';
import { User } from '../../../domain/entities/user.entity';

export class RegisterUseCase {
    constructor(private userRepository: UserRepository) { }

    async execute(input: RegisterInput): Promise<User> {
        const existingUser = await this.userRepository.findByEmail(input.email);
        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await PasswordService.hash(input.password);

        return this.userRepository.create({
            email: input.email,
            password: hashedPassword,
            role: input.role!,
            // createdAt is handled by DB default usually, but we have it in interface.
            // Prisma default handles it, but repo method expects data.
            // Repo create method constructs data.
        });
    }
}
