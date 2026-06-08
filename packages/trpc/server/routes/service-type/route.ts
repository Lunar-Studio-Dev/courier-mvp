import { z } from "../../schema";
import { serviceTypeService } from "../../services";
import {
  listServiceTypesInputSchema,
  listServiceTypesOutputSchema,
  createServiceTypeInputSchema,
  updateServiceTypeInputSchema,
  serviceTypeOutputSchema,
  getByIdInputSchema,
  deleteInputSchema,
} from "@repo/services/service-type/model";
import { adminProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Service Types"];
const getPath = generatePath("/service-types");

export const serviceTypeRouter = router({
  list: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/"), tags: TAGS } })
    .input(listServiceTypesInputSchema)
    .output(listServiceTypesOutputSchema)
    .query(({ input }) => serviceTypeService.list(input)),

  getById: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/:id"), tags: TAGS } })
    .input(getByIdInputSchema)
    .output(serviceTypeOutputSchema)
    .query(({ input }) => serviceTypeService.getById(input.id)),

  create: adminProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createServiceTypeInputSchema)
    .output(serviceTypeOutputSchema)
    .mutation(({ input }) => serviceTypeService.create(input)),

  update: adminProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/:id"), tags: TAGS } })
    .input(updateServiceTypeInputSchema)
    .output(serviceTypeOutputSchema)
    .mutation(({ input }) => serviceTypeService.update(input)),

  delete: adminProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/:id"), tags: TAGS } })
    .input(deleteInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(({ input }) => serviceTypeService.delete(input.id)),
});
