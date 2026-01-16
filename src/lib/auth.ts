import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface UserPayload {
    id: string;
    username: string;
    role: string;
}

export const signToken = (user: UserPayload) => {
    return jwt.sign(user, JWT_SECRET, { expiresIn: '1d' });
};

export const verifyToken = (token: string): UserPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as UserPayload;
    } catch (error) {
        return null;
    }
};
