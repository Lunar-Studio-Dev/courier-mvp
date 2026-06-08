import crypto from "crypto";
import { db } from "@repo/database";
import { usersTable } from "@repo/database/schema";
import { eq } from "drizzle-orm";
import { env } from "../env";
import { googleOAuth2Client } from "../clients/google-oauth";
import type {
  GetAuthenticationMethodOutputSchema,
  SignupInput,
  LoginInput,
  ChangePasswordInput,
  UserOutput,
} from "./model";

function hashPassword(password: string, salt: string): string {
  return crypto
    .createHmac("sha256", salt)
    .update(password)
    .digest("hex");
}

class UserService {
  public async getAuthenticationMethods(): Promise<
    ReadonlyArray<GetAuthenticationMethodOutputSchema>
  > {
    const supportedAuthenticationProviders: GetAuthenticationMethodOutputSchema[] = [];

    const isGoogleConfigured = !!(env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET);

    if (isGoogleConfigured) {
      const url = googleOAuth2Client.generateAuthUrl();
      supportedAuthenticationProviders.push({
        provider: "GOOGLE_OAUTH",
        displayName: "Google",
        displayText: "Signin with Google",
        authUrl: url,
      });
    }

    return supportedAuthenticationProviders;
  }

  public async getUserById(id: string): Promise<UserOutput | null> {
    const [user] = await db
      .select({
        id: usersTable.id,
        fullName: usersTable.fullName,
        email: usersTable.email,
        role: usersTable.role,
        profileImageUrl: usersTable.profileImageUrl,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    return user ?? null;
  }

  public async signup(input: SignupInput): Promise<UserOutput> {
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Email already registered");
    }

    const salt = crypto.randomBytes(32).toString("hex");
    const password = hashPassword(input.password, salt);

    const [user] = await db
      .insert(usersTable)
      .values({
        fullName: input.fullName,
        email: input.email,
        password,
        salt,
        role: input.role,
      })
      .returning({
        id: usersTable.id,
        fullName: usersTable.fullName,
        email: usersTable.email,
        role: usersTable.role,
        profileImageUrl: usersTable.profileImageUrl,
        createdAt: usersTable.createdAt,
      });

    return user!;
  }

  public async login(input: LoginInput): Promise<UserOutput & { id: string }> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .limit(1);

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const hashedInput = hashPassword(input.password, user.salt);
    if (hashedInput !== user.password) {
      throw new Error("Invalid email or password");
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      profileImageUrl: user.profileImageUrl,
      createdAt: user.createdAt,
    };
  }

  public async changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<void> {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    const hashedCurrent = hashPassword(input.currentPassword, user.salt);
    if (hashedCurrent !== user.password) {
      throw new Error("Current password is incorrect");
    }

    const newSalt = crypto.randomBytes(32).toString("hex");
    const newPassword = hashPassword(input.newPassword, newSalt);

    await db
      .update(usersTable)
      .set({
        password: newPassword,
        salt: newSalt,
        passwordChangedAt: new Date(),
      })
      .where(eq(usersTable.id, userId));
  }
}

export default UserService;
