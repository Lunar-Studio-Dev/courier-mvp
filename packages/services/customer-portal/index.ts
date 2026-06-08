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
import { eq, and, or, count, SQL, gte, lte, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type {
  MyShipmentsInput,
  MyShipmentsOutput,
  UpdateProfileInput,
  CustomerProfileOutput,
} from "./model";

class CustomerPortalService {
  async getMyShipments(
    customerId: string,
    input: MyShipmentsInput,
  ): Promise<MyShipmentsOutput> {
    const { role, status, dateFrom, dateTo, page, limit } = input;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [];

    if (role === "sender") {
      conditions.push(eq(shipmentsTable.senderId, customerId));
    } else if (role === "receiver") {
      conditions.push(eq(shipmentsTable.receiverId, customerId));
    } else {
      conditions.push(
        or(
          eq(shipmentsTable.senderId, customerId),
          eq(shipmentsTable.receiverId, customerId),
        )!,
      );
    }

    if (status) conditions.push(eq(shipmentsTable.status, status));
    if (dateFrom)
      conditions.push(gte(shipmentsTable.bookedAt, new Date(dateFrom)));
    if (dateTo)
      conditions.push(lte(shipmentsTable.bookedAt, new Date(dateTo)));

    const where = and(...conditions);

    const [data, totalResult] = await Promise.all([
      db
        .select({
          id: shipmentsTable.id,
          trackingNumber: shipmentsTable.trackingNumber,
          status: shipmentsTable.status,
          bookedAt: shipmentsTable.bookedAt,
          senderAddress: shipmentsTable.senderAddress,
          receiverAddress: shipmentsTable.receiverAddress,
          totalAmount: shipmentsTable.totalAmount,
          senderId: shipmentsTable.senderId,
        })
        .from(shipmentsTable)
        .where(where)
        .orderBy(desc(shipmentsTable.bookedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() }).from(shipmentsTable).where(where),
    ]);

    const mapped = data.map((row) => {
      const sAddr = row.senderAddress as {
        city: string;
        state: string;
      };
      const rAddr = row.receiverAddress as {
        city: string;
        state: string;
      };
      return {
        id: row.id,
        trackingNumber: row.trackingNumber,
        status: row.status,
        bookedAt: row.bookedAt,
        senderCity: sAddr.city,
        senderState: sAddr.state,
        receiverCity: rAddr.city,
        receiverState: rAddr.state,
        totalAmount: row.totalAmount,
        isSender: row.senderId === customerId,
      };
    });

    return {
      data: mapped,
      total: totalResult[0]?.count ?? 0,
      page,
      limit,
    };
  }

  async getShipmentDetail(customerId: string, shipmentId: string) {
    const [shipment] = await db
      .select({
        id: shipmentsTable.id,
        trackingNumber: shipmentsTable.trackingNumber,
        status: shipmentsTable.status,
        bookedAt: shipmentsTable.bookedAt,
        deliveredAt: shipmentsTable.deliveredAt,
        senderAddress: shipmentsTable.senderAddress,
        receiverAddress: shipmentsTable.receiverAddress,
        totalAmount: shipmentsTable.totalAmount,
        basePrice: shipmentsTable.basePrice,
        gstEnabled: shipmentsTable.gstEnabled,
        gstType: shipmentsTable.gstType,
        gstRate: shipmentsTable.gstRate,
        gstAmount: shipmentsTable.gstAmount,
        weight: shipmentsTable.weight,
        senderId: shipmentsTable.senderId,
        receiverId: shipmentsTable.receiverId,
        branchName: branchesTable.name,
        productTypeName: productTypesTable.name,
        serviceTypeName: serviceTypesTable.name,
        modeTypeName: modeTypesTable.name,
      })
      .from(shipmentsTable)
      .innerJoin(branchesTable, eq(shipmentsTable.branchId, branchesTable.id))
      .innerJoin(
        productTypesTable,
        eq(shipmentsTable.productTypeId, productTypesTable.id),
      )
      .innerJoin(
        serviceTypesTable,
        eq(shipmentsTable.serviceTypeId, serviceTypesTable.id),
      )
      .innerJoin(
        modeTypesTable,
        eq(shipmentsTable.modeTypeId, modeTypesTable.id),
      )
      .where(
        and(
          eq(shipmentsTable.id, shipmentId),
          or(
            eq(shipmentsTable.senderId, customerId),
            eq(shipmentsTable.receiverId, customerId),
          ),
        ),
      )
      .limit(1);

    if (!shipment) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Shipment not found",
      });
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

    return {
      ...shipment,
      isSender: shipment.senderId === customerId,
      history,
    };
  }

  async getProfile(customerId: string): Promise<CustomerProfileOutput> {
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(eq(customersTable.id, customerId))
      .limit(1);

    if (!customer) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Customer not found",
      });
    }

    const [sentResult] = await db
      .select({ count: count() })
      .from(shipmentsTable)
      .where(eq(shipmentsTable.senderId, customerId));

    const [receivedResult] = await db
      .select({ count: count() })
      .from(shipmentsTable)
      .where(eq(shipmentsTable.receiverId, customerId));

    return {
      id: customer.id,
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      idProofType: customer.idProofType,
      idProofNumber: customer.idProofNumber,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      totalShipmentsSent: sentResult?.count ?? 0,
      totalShipmentsReceived: receivedResult?.count ?? 0,
    };
  }

  async updateProfile(
    customerId: string,
    input: UpdateProfileInput,
  ): Promise<CustomerProfileOutput> {
    const updates: Record<string, unknown> = {};
    if (input.email !== undefined) updates.email = input.email;
    if (input.address !== undefined) updates.address = input.address;
    if (input.city !== undefined) updates.city = input.city;
    if (input.state !== undefined) updates.state = input.state;
    if (input.pincode !== undefined) updates.pincode = input.pincode;

    if (Object.keys(updates).length > 0) {
      await db
        .update(customersTable)
        .set(updates)
        .where(eq(customersTable.id, customerId));
    }

    return this.getProfile(customerId);
  }
}

export default CustomerPortalService;
