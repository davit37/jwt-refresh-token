import bcrypt from 'bcryptjs';

export class PasswordService {
    private static readonly SALT_ROUNDS = 10;

    static async hash(password: string): Promise<string> {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }

    static async compare(candidate: string, hash: string): Promise<boolean> {
        return bcrypt.compare(candidate, hash);
    }
}
