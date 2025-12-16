export interface RefreshToken {
    id: string;
    hashedToken: string;
    userId: string;
    revoked: boolean;
    expiresAt: Date;
    familyId: string;
    createdAt: Date;
}
