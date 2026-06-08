import { z, zodUndefinedModel } from "../../schema";
import { customerAuthService, customerPortalService } from "../../services";
import {
  myShipmentsInputSchema,
  myShipmentsOutputSchema,
  shipmentDetailInputSchema,
  updateProfileInputSchema,
  customerProfileOutputSchema,
} from "@repo/services/customer-portal/model";
import { customerProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { badRequest } from "../../utils/errors";

const TAGS = ["Customer Portal"];
const getPath = generatePath("/customer-portal");

async function resolveCustomerId(userId: string): Promise<string> {
  const customer = await customerAuthService.getCustomerByUserId(userId);
  if (!customer) {
    throw badRequest("Customer profile not found. Please contact admin.");
  }
  return customer.id;
}

export const customerPortalRouter = router({
  myShipments: customerProcedure
    .meta({ openapi: { method: "GET", path: getPath("/shipments"), tags: TAGS } })
    .input(myShipmentsInputSchema)
    .output(myShipmentsOutputSchema)
    .query(async ({ input, ctx }) => {
      const customerId = await resolveCustomerId(ctx.user!.id);
      return customerPortalService.getMyShipments(customerId, input);
    }),

  shipmentDetail: customerProcedure
    .meta({ openapi: { method: "GET", path: getPath("/shipments/:id"), tags: TAGS } })
    .input(shipmentDetailInputSchema)
    .output(z.any())
    .query(async ({ input, ctx }) => {
      const customerId = await resolveCustomerId(ctx.user!.id);
      return customerPortalService.getShipmentDetail(customerId, input.id);
    }),

  profile: customerProcedure
    .meta({ openapi: { method: "GET", path: getPath("/profile"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(customerProfileOutputSchema)
    .query(async ({ ctx }) => {
      const customerId = await resolveCustomerId(ctx.user!.id);
      return customerPortalService.getProfile(customerId);
    }),

  updateProfile: customerProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/profile"), tags: TAGS } })
    .input(updateProfileInputSchema)
    .output(customerProfileOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const customerId = await resolveCustomerId(ctx.user!.id);
      return customerPortalService.updateProfile(customerId, input);
    }),
});
