import { z } from "../../schema";
import { customerService } from "../../services";
import {
  listCustomersInputSchema,
  listCustomersOutputSchema,
  createCustomerInputSchema,
  updateCustomerInputSchema,
  customerOutputSchema,
  getByIdInputSchema,
  deleteInputSchema,
  searchCustomersInputSchema,
  customerSearchResultSchema,
} from "@repo/services/customer/model";
import { adminProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Customers"];
const getPath = generatePath("/customers");

export const customerRouter = router({
  list: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/"), tags: TAGS } })
    .input(listCustomersInputSchema)
    .output(listCustomersOutputSchema)
    .query(({ input }) => customerService.list(input)),

  getById: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/:id"), tags: TAGS } })
    .input(getByIdInputSchema)
    .output(customerOutputSchema)
    .query(({ input }) => customerService.getById(input.id)),

  create: adminProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createCustomerInputSchema)
    .output(customerOutputSchema)
    .mutation(({ input }) => customerService.create(input)),

  update: adminProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/:id"), tags: TAGS } })
    .input(updateCustomerInputSchema)
    .output(customerOutputSchema)
    .mutation(({ input }) => customerService.update(input)),

  delete: adminProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/:id"), tags: TAGS } })
    .input(deleteInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(({ input }) => customerService.delete(input.id)),

  search: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/search"), tags: TAGS } })
    .input(searchCustomersInputSchema)
    .output(customerSearchResultSchema)
    .query(({ input }) => customerService.search(input.query)),
});
