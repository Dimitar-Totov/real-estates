import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET!;

export type JwtPayload = {
  id: number;
  email: string;
  username: string;
  role: "user" | "admin";
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}
