import { z } from "../../schema";
import { pricingRuleService } from "../../services";
import {
  listPricingRulesInputSchema,
  listPricingRulesOutputSchema,
  createPricingRuleInputSchema,
  updatePricingRuleInputSchema,
  pricingRuleOutputSchema,
  getByIdInputSchema,
  deleteInputSchema,
  calculatePriceInputSchema,
  calculatePriceOutputSchema,
} from "@repo/services/pricing-rule/model";
import { adminProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Pricing Rules"];
const getPath = generatePath("/pricing-rules");

export const pricingRuleRouter = router({
  list: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/"), tags: TAGS } })
    .input(listPricingRulesInputSchema)
    .output(listPricingRulesOutputSchema)
    .query(({ input }) => pricingRuleService.list(input)),

  getById: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/:id"), tags: TAGS } })
    .input(getByIdInputSchema)
    .output(pricingRuleOutputSchema)
    .query(({ input }) => pricingRuleService.getById(input.id)),

  create: adminProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createPricingRuleInputSchema)
    .output(pricingRuleOutputSchema)
    .mutation(({ input }) => pricingRuleService.create(input)),

  update: adminProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/:id"), tags: TAGS } })
    .input(updatePricingRuleInputSchema)
    .output(pricingRuleOutputSchema)
    .mutation(({ input }) => pricingRuleService.update(input)),

  delete: adminProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/:id"), tags: TAGS } })
    .input(deleteInputSchema)
    .output(z.object({ success: z.boolean() }))
    .mutation(({ input }) => pricingRuleService.delete(input.id)),

  calculatePrice: adminProcedure
    .meta({ openapi: { method: "POST", path: getPath("/calculate"), tags: TAGS } })
    .input(calculatePriceInputSchema)
    .output(calculatePriceOutputSchema)
    .mutation(({ input }) => pricingRuleService.calculatePrice(input)),
});
