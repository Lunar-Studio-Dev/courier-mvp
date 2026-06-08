import { z } from "../../schema";
import { branchService } from "../../services";
import {
  listBranchesInputSchema,
  listBranchesOutputSchema,
  createBranchInputSchema,
  updateBranchInputSchema,
  branchOutputSchema,
  getByIdInputSchema,
  deleteInputSchema,
} from "@repo/services/branch/model";
import { adminProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Branches"];
const getPath = generatePath("/branches");

export const branchRouter = router({
  list: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/"), tags: TAGS } })
    .input(listBranchesInputSchema)
    .output(listBranchesOutputSchema)
    .query(({ input }) => branchService.list(input)),

  getById: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/:id"), tags: TAGS } })
    .input(getByIdInputSchema)
    .output(branchOutputSchema)
    .query(({ input }) => branchService.getById(input.id)),

  create: adminProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createBranchInputSchema)
    .output(branchOutputSchema)
    .mutation(({ input }) => branchService.create(input)),

  update: adminProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/:id"), tags: TAGS } })
    .input(updateBranchInputSchema)
    .output(branchOutputSchema)
    .mutation(({ input }) => branchService.update(input)),

  delete: adminProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/:id"), tags: TAGS } })
    .input(deleteInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(({ input }) => branchService.delete(input.id)),
});
