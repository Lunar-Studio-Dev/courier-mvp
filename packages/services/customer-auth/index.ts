import crypto from "crypto";
import { db } from "@repo/database";
import { customersTable, usersTable, otpTable } from "@repo/database/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { signToken } from "../auth";
import { NotificationService } from "@repo/notification";
import type { RequestOtpInput, VerifyOtpInput, CustomerAuthOutput } from "./model";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_REQUESTS = 3;

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

class CustomerAuthService {
  async requestOtp(input: RequestOtpInput): Promise<{ success: boolean; message: string }> {
    const { phone } = input;

    // Find customer by phone
    const [customer] = await db
      .select({ id: customersTable.id, isActive: customersTable.isActive })
      .from(customersTable)
      .where(eq(customersTable.phone, phone))
      .limit(1);

    if (!customer || !customer.isActive) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Phone number not registered. Contact admin to create your account.",
      });
    }

    // Rate limiting: check recent OTP requests
    const recentOtps = await db
      .select({ id: otpTable.id })
      .from(otpTable)
      .where(
        and(
          eq(otpTable.phone, phone),
          gt(otpTable.createdAt, new Date(Date.now() - RATE_LIMIT_WINDOW_MS)),
        ),
      );

    if (recentOtps.length >= MAX_OTP_REQUESTS) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many OTP requests. Please try again later.",
      });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await db.insert(otpTable).values({
      phone,
      otp,
      expiresAt,
    });

    // Send OTP via SMS (fire-and-forget)
    try {
      const notificationService = new NotificationService();
      const adapters = await (notificationService as any).getActiveAdapters();
      const smsAdapter = adapters.find((a: any) => a.channel === "sms");
      if (smsAdapter) {
        smsAdapter.adapter
          .send({
            to: phone,
            message: `Your TPC India login OTP is ${otp}. Valid for 5 minutes.`,
          })
          .catch(() => {});
      }
    } catch {
      // SMS delivery failure shouldn't block OTP creation
    }

    // Log OTP in dev mode
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV OTP] Phone: ${phone}, OTP: ${otp}`);
    }

    return { success: true, message: "OTP sent to your phone number" };
  }

  async verifyOtp(input: VerifyOtpInput): Promise<CustomerAuthOutput & { token: string }> {
    const { phone, otp } = input;

    // Find valid OTP
    const [otpRecord] = await db
      .select()
      .from(otpTable)
      .where(
        and(
          eq(otpTable.phone, phone),
          eq(otpTable.verified, false),
          gt(otpTable.expiresAt, new Date()),
        ),
      )
      .orderBy(desc(otpTable.createdAt))
      .limit(1);

    if (!otpRecord) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    // Increment attempts
    const newAttempts = (otpRecord.attempts ?? 0) + 1;
    await db
      .update(otpTable)
      .set({ attempts: newAttempts })
      .where(eq(otpTable.id, otpRecord.id));

    if (newAttempts > MAX_ATTEMPTS) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many attempts. Please request a new OTP.",
      });
    }

    // Dev mode: accept "123456" as a valid OTP
    const isValidOtp =
      otpRecord.otp === otp ||
      (process.env.NODE_ENV !== "production" && otp === "123456");

    if (!isValidOtp) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid OTP. Please try again.",
      });
    }

    // Mark OTP as verified
    await db
      .update(otpTable)
      .set({ verified: true })
      .where(eq(otpTable.id, otpRecord.id));

    // Find customer
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.phone, phone))
      .limit(1);

    if (!customer) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
    }

    let userId = customer.userId;
    let user;

    if (userId) {
      // Existing linked user
      const [existingUser] = await db
        .select({
          id: usersTable.id,
          fullName: usersTable.fullName,
          email: usersTable.email,
          role: usersTable.role,
          profileImageUrl: usersTable.profileImageUrl,
          createdAt: usersTable.createdAt,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

      user = existingUser;
    }

    if (!user) {
      // Create a new user account for this customer
      const salt = crypto.randomBytes(32).toString("hex");
      const password = crypto.randomBytes(32).toString("hex");
      const hashedPassword = crypto
        .createHmac("sha256", salt)
        .update(password)
        .digest("hex");

      const syntheticEmail = `${phone}@customer.tpcindia.com`;

      const [newUser] = await db
        .insert(usersTable)
        .values({
          fullName: customer.fullName,
          email: syntheticEmail,
          password: hashedPassword,
          salt,
          role: "customer",
        })
        .returning({
          id: usersTable.id,
          fullName: usersTable.fullName,
          email: usersTable.email,
          role: usersTable.role,
          profileImageUrl: usersTable.profileImageUrl,
          createdAt: usersTable.createdAt,
        });

      user = newUser!;

      // Link the user to the customer
      await db
        .update(customersTable)
        .set({ userId: user.id })
        .where(eq(customersTable.id, customer.id));
    }

    const token = signToken({ id: user!.id });

    return {
      customerId: customer.id,
      user: user!,
      token,
    };
  }

  async getCustomerByUserId(userId: string) {
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.userId, userId))
      .limit(1);

    return customer ?? null;
  }
}

export default CustomerAuthService;
