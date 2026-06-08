"use client";

import { trpc } from "~/trpc/client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Loader2 } from "lucide-react";

interface PriceCalculatorProps {
  originState: string;
  originCity: string;
  destinationState: string;
  destinationCity: string;
  productTypeId: string;
  serviceTypeId: string;
  modeTypeId: string;
  weight: string;
  gstEnabled: boolean;
}

function formatINR(value: string) {
  return `₹${parseFloat(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export function PriceCalculator({
  originState,
  originCity,
  destinationState,
  destinationCity,
  productTypeId,
  serviceTypeId,
  modeTypeId,
  weight,
  gstEnabled,
}: PriceCalculatorProps) {
  const canCalculate =
    originState && destinationState && productTypeId && serviceTypeId && modeTypeId && weight && parseFloat(weight) > 0;

  const calcMutation = trpc.pricingRules.calculatePrice.useMutation();

  if (!canCalculate) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Price Breakdown</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fill in shipment details to calculate price.
          </p>
        </CardContent>
      </Card>
    );
  }

  const basePrice = calcMutation.data ? parseFloat(calcMutation.data.basePrice) : 0;
  const gstType = originState === destinationState ? "CGST+SGST" : "IGST";
  const gstRate = 18;
  const gstAmount = gstEnabled ? (basePrice * gstRate) / 100 : 0;
  const totalAmount = basePrice + gstAmount;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Price Breakdown</CardTitle>
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() =>
              calcMutation.mutate({
                originState,
                originCity: originCity || undefined,
                destinationState,
                destinationCity: destinationCity || undefined,
                productTypeId,
                serviceTypeId,
                modeTypeId,
                weight,
              })
            }
          >
            {calcMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Calculate"
            )}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {calcMutation.error && (
          <p className="text-sm text-destructive">{calcMutation.error.message}</p>
        )}
        {calcMutation.data && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Unit Price × {weight} kg
              </span>
              <span>{formatINR(calcMutation.data.unitPrice)} × {weight}</span>
            </div>
            {parseFloat(calcMutation.data.minimumCharge) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Min. Charge</span>
                <span>{formatINR(calcMutation.data.minimumCharge)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-medium">
              <span>Base Price</span>
              <span>{formatINR(calcMutation.data.basePrice)}</span>
            </div>
            <Separator />
            {gstEnabled && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{gstType} @ {gstRate}%</span>
                <span>{formatINR(gstAmount.toFixed(2))}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatINR(totalAmount.toFixed(2))}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
