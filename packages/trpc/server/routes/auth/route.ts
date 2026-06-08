import { z, zodUndefinedModel } from "../../schema";
import { userService } from "../../services";
import {
  getAuthenticationMethodOutputSchema,
  signupInputSchema,
  loginInputSchema,
  changePasswordInputSchema,
  userOutputSchema,
} from "@repo/services/user/model";
import { signToken } from "@repo/services/auth";
import { publicProcedure, protectedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { badRequest } from "../../utils/errors";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

export const authRouter = router({
  getSupportedAuthenticationProviders: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/supported-providers"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.readonly(z.array(getAuthenticationMethodOutputSchema)))
    .query(async () => {
      const supportedMethods = await userService.getAuthenticationMethods();
      return supportedMethods;
    }),

  signup: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/signup"), tags: TAGS } })
    .input(signupInputSchema)
    .output(userOutputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await userService.signup(input);
        const token = signToken({ id: user.id });
        ctx.setAuthentication(token);
        return user;
      } catch (err) {
        throw badRequest(err instanceof Error ? err.message : "Signup failed");
      }
    }),

  login: publicProcedure
    .meta({ openapi: { method: "POST", path: getPath("/login"), tags: TAGS } })
    .input(loginInputSchema)
    .output(userOutputSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await userService.login(input);
        const token = signToken({ id: user.id });
        ctx.setAuthentication(token);
        return user;
      } catch (err) {
        throw badRequest(err instanceof Error ? err.message : "Login failed");
      }
    }),

  me: protectedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/me"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(userOutputSchema)
    .query(async ({ ctx }) => {
      const user = await userService.getUserById(ctx.user!.id);
      if (!user) throw badRequest("User not found");
      return user;
    }),

  signOut: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/sign-out"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx }) => {
      ctx.clearAuthentication();
      return { success: true };
    }),

  changePassword: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/change-password"), tags: TAGS } })
    .input(changePasswordInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await userService.changePassword(ctx.user!.id, input);
        ctx.clearAuthentication();
        return { success: true };
      } catch (err) {
        throw badRequest(err instanceof Error ? err.message : "Failed to change password");
      }
    }),
});
