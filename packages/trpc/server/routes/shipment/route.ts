import { shipmentService } from "../../services";
import {
  listShipmentsInputSchema,
  listShipmentsOutputSchema,
  createShipmentInputSchema,
  updateShipmentStatusInputSchema,
  shipmentOutputSchema,
  getByIdInputSchema,
  trackShipmentInputSchema,
  trackingOutputSchema,
} from "@repo/services/shipment/model";
import { adminProcedure, publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Shipments"];
const getPath = generatePath("/shipments");

export const shipmentRouter = router({
  list: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/"), tags: TAGS } })
    .input(listShipmentsInputSchema)
    .output(listShipmentsOutputSchema)
    .query(({ input }) => shipmentService.list(input)),

  getById: adminProcedure
    .meta({ openapi: { method: "GET", path: getPath("/:id"), tags: TAGS } })
    .input(getByIdInputSchema)
    .output(shipmentOutputSchema)
    .query(({ input }) => shipmentService.getById(input.id)),

  create: adminProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createShipmentInputSchema)
    .output(shipmentOutputSchema)
    .mutation(({ input }) => shipmentService.create(input)),

  updateStatus: adminProcedure
    .meta({ openapi: { method: "PUT", path: getPath("/:id/status"), tags: TAGS } })
    .input(updateShipmentStatusInputSchema)
    .output(shipmentOutputSchema)
    .mutation(({ input }) => shipmentService.updateStatus(input)),

  track: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath("/track/:trackingNumber"), tags: TAGS } })
    .input(trackShipmentInputSchema)
    .output(trackingOutputSchema)
    .query(({ input }) => shipmentService.track(input.trackingNumber)),
});
