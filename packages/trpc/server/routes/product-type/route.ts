import { z } from "../../schema";
import { productTypeService } from "../../services";
import {
  listProductTypesInputSchema,
  listProductTypesOutputSchema,
  createProductTypeInputSchema,
  updateProductTypeInputSchema,
  productTypeOutputSchema,
  getByIdInputSchema,
  deleteInputSchema,
} from "@repo/services/product-type/model";
import { adminProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Product Types"];
const getPath = generatePath("/product-types");

export const productTypeRouter = router({
  list: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/"), tags: TAGS } })
    .input(listProductTypesInputSchema)
    .output(listProductTypesOutputSchema)
    .query(({ input }) => productTypeService.list(input)),

  getById: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/:id"), tags: TAGS } })
    .input(getByIdInputSchema)
    .output(productTypeOutputSchema)
    .query(({ input }) => productTypeService.getById(input.id)),

  create: adminProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createProductTypeInputSchema)
    .output(productTypeOutputSchema)
    .mutation(({ input }) => productTypeService.create(input)),

  update: adminProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/:id"), tags: TAGS } })
    .input(updateProductTypeInputSchema)
    .output(productTypeOutputSchema)
    .mutation(({ input }) => productTypeService.update(input)),

  delete: adminProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/:id"), tags: TAGS } })
    .input(deleteInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(({ input }) => productTypeService.delete(input.id)),
});
