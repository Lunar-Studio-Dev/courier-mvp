import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { productTypeRouter } from "./routes/product-type/route";
import { serviceTypeRouter } from "./routes/service-type/route";
import { modeTypeRouter } from "./routes/mode-type/route";
import { branchRouter } from "./routes/branch/route";
import { destinationRouter } from "./routes/destination/route";
import { customerRouter } from "./routes/customer/route";
import { pricingRuleRouter } from "./routes/pricing-rule/route";
import { shipmentRouter } from "./routes/shipment/route";
import { invoiceRouter } from "./routes/invoice/route";
import { notificationRouter } from "./routes/notification/route";
import { dashboardRouter } from "./routes/dashboard/route";
import { customerAuthRouter } from "./routes/customer-auth/route";
import { customerPortalRouter } from "./routes/customer-portal/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  productTypes: productTypeRouter,
  serviceTypes: serviceTypeRouter,
  modeTypes: modeTypeRouter,
  branches: branchRouter,
  destinations: destinationRouter,
  customers: customerRouter,
  pricingRules: pricingRuleRouter,
  shipments: shipmentRouter,
  invoices: invoiceRouter,
  notifications: notificationRouter,
  dashboard: dashboardRouter,
  customerAuth: customerAuthRouter,
  customerPortal: customerPortalRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
