import { z } from "../../schema";
import { destinationService } from "../../services";
import {
  listDestinationsInputSchema,
  listDestinationsOutputSchema,
  updateDestinationInputSchema,
  destinationOutputSchema,
  bulkUpdateByStateInputSchema,
  bulkUpdateOutputSchema,
  getCitiesByStateInputSchema,
  checkServiceabilityInputSchema,
  statesListOutputSchema,
  citiesListOutputSchema,
  serviceabilityOutputSchema,
  searchDestinationsInputSchema,
  createDestinationInputSchema,
} from "@repo/services/destination/model";
import { publicProcedure, adminProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Destinations"];
const getPath = generatePath("/destinations");

export const destinationRouter = router({
  list: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/"), tags: TAGS } })
    .input(listDestinationsInputSchema)
    .output(listDestinationsOutputSchema)
    .query(({ input }) => destinationService.list(input)),

  update: adminProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/:id"), tags: TAGS } })
    .input(updateDestinationInputSchema)
    .output(destinationOutputSchema)
    .mutation(({ input }) => destinationService.update(input)),

  bulkUpdateByState: adminProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/bulk-state"), tags: TAGS } })
    .input(bulkUpdateByStateInputSchema)
    .output(bulkUpdateOutputSchema)
    .mutation(({ input }) => destinationService.bulkUpdateByState(input)),

  getStates: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/states"), tags: TAGS } })
    .input(z.void())
    .output(statesListOutputSchema)
    .query(() => destinationService.getStates()),

  getCitiesByState: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/cities"), tags: TAGS } })
    .input(getCitiesByStateInputSchema)
    .output(citiesListOutputSchema)
    .query(({ input }) => destinationService.getCitiesByState(input.state)),

  checkServiceability: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/check/:pincode"), tags: TAGS } })
    .input(checkServiceabilityInputSchema)
    .output(serviceabilityOutputSchema)
    .query(({ input }) => destinationService.checkServiceability(input.pincode)),

  search: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/search"), tags: TAGS } })
    .input(searchDestinationsInputSchema)
    .output(z.array(destinationOutputSchema))
    .query(({ input }) => destinationService.search(input.query)),

  create: adminProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createDestinationInputSchema)
    .output(destinationOutputSchema)
    .mutation(({ input }) => destinationService.create(input)),
});
