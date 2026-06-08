import { z, zodUndefinedModel } from "../../schema";
import { customerAuthService } from "../../services";
import {
  requestOtpInputSchema,
  verifyOtpInputSchema,
  requestOtpOutputSchema,
  customerAuthOutputSchema,
  customerProfileOutputSchema,
} from "@repo/services/customer-auth/model";
import { publicProcedure, customerProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { badRequest } from "../../utils/errors";

const TAGS = ["Customer Auth"];
const getPath = generatePath("/customer-auth");

export const customerAuthRouter = router({
  requestOtp: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/request-otp"), tags: TAGS } })
    .input(requestOtpInputSchema)
    .output(requestOtpOutputSchema)
    .mutation(async ({ input }) => {
      return customerAuthService.requestOtp(input);
    }),

  verifyOtp: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/verify-otp"), tags: TAGS } })
    .input(verifyOtpInputSchema)
    .output(customerAuthOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const result = await customerAuthService.verifyOtp(input);
      ctx.setAuthentication(result.token);
      return {
        customerId: result.customerId,
        user: result.user,
      };
    }),

  getProfile: customerProcedure
    .meta({ openapi: { method: "GET", path: getPath("/profile"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(customerProfileOutputSchema)
    .query(async ({ ctx }) => {
      const customer = await customerAuthService.getCustomerByUserId(ctx.user!.id);
      if (!customer) {
        throw badRequest("Customer profile not found");
      }
      return {
        id: customer.id,
        fullName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        idProofType: customer.idProofType,
        idProofNumber: customer.idProofNumber,
        isActive: customer.isActive,
        createdAt: customer.createdAt,
      };
    }),

  signOut: customerProcedure
    .meta({ openapi: { method: "POST", path: getPath("/sign-out"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx }) => {
      ctx.clearAuthentication();
      return { success: true };
    }),
});
