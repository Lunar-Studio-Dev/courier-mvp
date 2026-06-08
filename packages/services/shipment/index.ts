import { db } from "@repo/database";
import {
  shipmentsTable,
  shipmentTrackingHistoryTable,
  customersTable,
  branchesTable,
  productTypesTable,
  serviceTypesTable,
  modeTypesTable,
} from "@repo/database/schema";
import { eq, and, count, SQL, ilike, gte, lte, desc, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { NotificationService } from "@repo/notification";
import PricingRuleService from "../pricing-rule";
import type {
  CreateShipmentInput,
  UpdateShipmentStatusInput,
  ListShipmentsInput,
  ListShipmentsOutput,
  ShipmentOutput,
  TrackingOutput,
  Address,
  ShipmentStatus,
} from "./model";

const VALID_TRANSITIONS: Record<string, string[]> = {
  BOOKED: ["PICKED_UP", "CANCELLED", "ON_HOLD"],
  PICKED_UP: ["IN_TRANSIT", "CANCELLED", "ON_HOLD"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "RETURNED", "ON_HOLD"],
  OUT_FOR_DELIVERY: ["DELIVERED", "RETURNED", "ON_HOLD"],
  ON_HOLD: ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "CANCELLED"],
};

const GST_RATE = 18;

const pricingRuleService = new PricingRuleService();

const selectWithJoins = {
  id: shipmentsTable.id,
  trackingNumber: shipmentsTable.trackingNumber,
  branchId: shipmentsTable.branchId,
  senderId: shipmentsTable.senderId,
  receiverId: shipmentsTable.receiverId,
  senderAddress: shipmentsTable.senderAddress,
  receiverAddress: shipmentsTable.receiverAddress,
  productTypeId: shipmentsTable.productTypeId,
  serviceTypeId: shipmentsTable.serviceTypeId,
  modeTypeId: shipmentsTable.modeTypeId,
  weight: shipmentsTable.weight,
  declaredValue: shipmentsTable.declaredValue,
  basePrice: shipmentsTable.basePrice,
  gstEnabled: shipmentsTable.gstEnabled,
  gstType: shipmentsTable.gstType,
  gstRate: shipmentsTable.gstRate,
  gstAmount: shipmentsTable.gstAmount,
  totalAmount: shipmentsTable.totalAmount,
  status: shipmentsTable.status,
  invoiceTemplateId: shipmentsTable.invoiceTemplateId,
  bookedAt: shipmentsTable.bookedAt,
  deliveredAt: shipmentsTable.deliveredAt,
  createdAt: shipmentsTable.createdAt,
  updatedAt: shipmentsTable.updatedAt,
  branchName: branchesTable.name,
  productTypeName: productTypesTable.name,
  serviceTypeName: serviceTypesTable.name,
  modeTypeName: modeTypesTable.name,
};

function baseQuery() {
  return db
    .select(selectWithJoins)
    .from(shipmentsTable)
    .innerJoin(branchesTable, eq(shipmentsTable.branchId, branchesTable.id))
    .innerJoin(productTypesTable, eq(shipmentsTable.productTypeId, productTypesTable.id))
    .innerJoin(serviceTypesTable, eq(shipmentsTable.serviceTypeId, serviceTypesTable.id))
    .innerJoin(modeTypesTable, eq(shipmentsTable.modeTypeId, modeTypesTable.id));
}

class ShipmentService {
  async create(input: CreateShipmentInput): Promise<ShipmentOutput> {
    const [sender] = await db.select().from(customersTable).where(eq(customersTable.id, input.senderId));
    if (!sender || !sender.isActive) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Sender not found or inactive" });
    }

    const [receiver] = await db.select().from(customersTable).where(eq(customersTable.id, input.receiverId));
    if (!receiver || !receiver.isActive) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Receiver not found or inactive" });
    }

    const [branch] = await db.select().from(branchesTable).where(eq(branchesTable.id, input.branchId));
    if (!branch || !branch.isActive) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Branch not found or inactive" });
    }

    const senderAddr: Address = input.senderAddress ?? {
      fullName: sender.fullName,
      phone: sender.phone,
      address: sender.address,
      city: sender.city,
      state: sender.state,
      pincode: sender.pincode,
    };

    const receiverAddr: Address = input.receiverAddress ?? {
      fullName: receiver.fullName,
      phone: receiver.phone,
      address: receiver.address,
      city: receiver.city,
      state: receiver.state,
      pincode: receiver.pincode,
    };

    const priceResult = await pricingRuleService.calculatePrice({
      originState: senderAddr.state,
      originCity: senderAddr.city,
      destinationState: receiverAddr.state,
      destinationCity: receiverAddr.city,
      productTypeId: input.productTypeId,
      serviceTypeId: input.serviceTypeId,
      modeTypeId: input.modeTypeId,
      weight: input.weight,
    });

    const basePrice = parseFloat(priceResult.basePrice);
    const gstType = senderAddr.state === receiverAddr.state ? "CGST+SGST" : "IGST";
    const gstAmount = input.gstEnabled ? (basePrice * GST_RATE) / 100 : 0;
    const totalAmount = basePrice + gstAmount;

    const trackingNumber = await this.generateTrackingNumber();

    const [shipment] = await db
      .insert(shipmentsTable)
      .values({
        trackingNumber,
        branchId: input.branchId,
        senderId: input.senderId,
        receiverId: input.receiverId,
        senderAddress: senderAddr,
        receiverAddress: receiverAddr,
        productTypeId: input.productTypeId,
        serviceTypeId: input.serviceTypeId,
        modeTypeId: input.modeTypeId,
        weight: input.weight,
        declaredValue: input.declaredValue,
        basePrice: basePrice.toFixed(2),
        gstEnabled: input.gstEnabled,
        gstType: input.gstEnabled ? gstType : null,
        gstRate: input.gstEnabled ? GST_RATE.toFixed(2) : null,
        gstAmount: gstAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        status: "BOOKED",
      })
      .returning({ id: shipmentsTable.id });

    await db.insert(shipmentTrackingHistoryTable).values({
      shipmentId: shipment!.id,
      status: "BOOKED",
      location: branch.city,
      remarks: "Shipment booked",
    });

    // Fire-and-forget notifications
    try {
      const notificationService = new NotificationService();
      const trackingUrl = `${process.env.PUBLIC_URL ?? "https://tpcindia.com"}/track/${trackingNumber}`;
      notificationService
        .sendShipmentBooked({
          trackingNumber,
          senderName: senderAddr.fullName,
          receiverName: receiverAddr.fullName,
          originCity: senderAddr.city,
          destinationCity: receiverAddr.city,
          weight: input.weight,
          totalAmount: totalAmount.toFixed(2),
          trackingUrl,
          senderPhone: senderAddr.phone,
          receiverPhone: receiverAddr.phone,
        })
        .catch(() => {});
    } catch {}

    return this.getById(shipment!.id);
  }

  async list(input: ListShipmentsInput): Promise<ListShipmentsOutput> {
    const { search, status, branchId, dateFrom, dateTo, page, limit } = input;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];
    if (search) {
      conditions.push(
        or(
          eq(shipmentsTable.trackingNumber, search),
          ilike(shipmentsTable.trackingNumber, `%${search}%`),
        )!,
      );
    }
    if (status) conditions.push(eq(shipmentsTable.status, status));
    if (branchId) conditions.push(eq(shipmentsTable.branchId, branchId));
    if (dateFrom) conditions.push(gte(shipmentsTable.bookedAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(shipmentsTable.bookedAt, new Date(dateTo)));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      baseQuery()
        .where(where)
        .orderBy(desc(shipmentsTable.bookedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(shipmentsTable).where(where),
    ]);

    return {
      data: data as unknown as ShipmentOutput[],
      total: totalResult[0]?.count ?? 0,
      page,
      limit,
    };
  }

  async getById(id: string): Promise<ShipmentOutput> {
    const [record] = await baseQuery().where(eq(shipmentsTable.id, id));
    if (!record) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Shipment not found" });
    }
    return record as unknown as ShipmentOutput;
  }

  async updateStatus(input: UpdateShipmentStatusInput): Promise<ShipmentOutput> {
    const { id, status, location, remarks } = input;

    const [shipment] = await db
      .select({ id: shipmentsTable.id, status: shipmentsTable.status })
      .from(shipmentsTable)
      .where(eq(shipmentsTable.id, id));

    if (!shipment) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Shipment not found" });
    }

    const allowed = VALID_TRANSITIONS[shipment.status];
    if (!allowed || !allowed.includes(status)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Cannot transition from ${shipment.status} to ${status}`,
      });
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "DELIVERED") {
      updateData.deliveredAt = new Date();
    }

    await db.update(shipmentsTable).set(updateData).where(eq(shipmentsTable.id, id));

    await db.insert(shipmentTrackingHistoryTable).values({
      shipmentId: id,
      status,
      location: location || null,
      remarks: remarks || null,
    });

    // Fire-and-forget notifications
    try {
      const notificationService = new NotificationService();
      const [fullShipment] = await db
        .select({
          trackingNumber: shipmentsTable.trackingNumber,
          receiverAddress: shipmentsTable.receiverAddress,
          senderAddress: shipmentsTable.senderAddress,
        })
        .from(shipmentsTable)
        .where(eq(shipmentsTable.id, id));

      if (fullShipment) {
        const rAddr = fullShipment.receiverAddress as Address;
        const sAddr = fullShipment.senderAddress as Address;
        const trackingUrl = `${process.env.PUBLIC_URL ?? "https://tpcindia.com"}/track/${fullShipment.trackingNumber}`;

        if (status === "DELIVERED") {
          notificationService
            .sendDeliveryConfirmation({
              trackingNumber: fullShipment.trackingNumber,
              deliveredAt: new Date(),
              receiverName: rAddr.fullName,
              trackingUrl,
              senderPhone: sAddr.phone,
              receiverPhone: rAddr.phone,
            })
            .catch(() => {});
        } else {
          notificationService
            .sendStatusUpdate({
              trackingNumber: fullShipment.trackingNumber,
              status,
              location: location ?? "",
              remarks: remarks ?? "",
              trackingUrl,
              receiverPhone: rAddr.phone,
            })
            .catch(() => {});
        }
      }
    } catch {}

    return this.getById(id);
  }

  async track(trackingNumber: string): Promise<TrackingOutput> {
    const [shipment] = await db
      .select({
        trackingNumber: shipmentsTable.trackingNumber,
        status: shipmentsTable.status,
        bookedAt: shipmentsTable.bookedAt,
        deliveredAt: shipmentsTable.deliveredAt,
        senderAddress: shipmentsTable.senderAddress,
        receiverAddress: shipmentsTable.receiverAddress,
        id: shipmentsTable.id,
      })
      .from(shipmentsTable)
      .where(eq(shipmentsTable.trackingNumber, trackingNumber));

    if (!shipment) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Shipment not found" });
    }

    const history = await db
      .select({
        status: shipmentTrackingHistoryTable.status,
        location: shipmentTrackingHistoryTable.location,
        remarks: shipmentTrackingHistoryTable.remarks,
        timestamp: shipmentTrackingHistoryTable.timestamp,
      })
      .from(shipmentTrackingHistoryTable)
      .where(eq(shipmentTrackingHistoryTable.shipmentId, shipment.id))
      .orderBy(desc(shipmentTrackingHistoryTable.timestamp));

    const sAddr = shipment.senderAddress as Address;
    const rAddr = shipment.receiverAddress as Address;

    return {
      trackingNumber: shipment.trackingNumber,
      status: shipment.status,
      bookedAt: shipment.bookedAt,
      deliveredAt: shipment.deliveredAt,
      senderCity: sAddr.city,
      senderState: sAddr.state,
      receiverCity: rAddr.city,
      receiverState: rAddr.state,
      history,
    };
  }

  private async generateTrackingNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const prefix = `TPC${dateStr}`;

    const [latest] = await db
      .select({ trackingNumber: shipmentsTable.trackingNumber })
      .from(shipmentsTable)
      .where(ilike(shipmentsTable.trackingNumber, `${prefix}%`))
      .orderBy(desc(shipmentsTable.trackingNumber))
      .limit(1);

    let seq = 1;
    if (latest) {
      const lastSeq = parseInt(latest.trackingNumber.slice(prefix.length), 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}${seq.toString().padStart(5, "0")}`;
  }
}

export default ShipmentService;
