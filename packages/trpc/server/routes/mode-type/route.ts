import { z } from "../../schema";
import { modeTypeService } from "../../services";
import {
  listModeTypesInputSchema,
  listModeTypesOutputSchema,
  createModeTypeInputSchema,
  updateModeTypeInputSchema,
  modeTypeOutputSchema,
  getByIdInputSchema,
  deleteInputSchema,
} from "@repo/services/mode-type/model";
import { adminProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Mode Types"];
const getPath = generatePath("/mode-types");

export const modeTypeRouter = router({
  list: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/"), tags: TAGS } })
    .input(listModeTypesInputSchema)
    .output(listModeTypesOutputSchema)
    .query(({ input }) => modeTypeService.list(input)),

  getById: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/:id"), tags: TAGS } })
    .input(getByIdInputSchema)
    .output(modeTypeOutputSchema)
    .query(({ input }) => modeTypeService.getById(input.id)),

  create: adminProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createModeTypeInputSchema)
    .output(modeTypeOutputSchema)
    .mutation(({ input }) => modeTypeService.create(input)),

  update: adminProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/:id"), tags: TAGS } })
    .input(updateModeTypeInputSchema)
    .output(modeTypeOutputSchema)
    .mutation(({ input }) => modeTypeService.update(input)),

  delete: adminProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/:id"), tags: TAGS } })
    .input(deleteInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(({ input }) => modeTypeService.delete(input.id)),
});
