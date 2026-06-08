"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Search, Package } from "lucide-react";

export default function TrackSearchPage() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = trackingNumber.trim();
    if (value) {
      router.push(`/track/${value}`);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Package className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Track Your Shipment</h1>
          <p className="text-muted-foreground">
            Enter your tracking number to see real-time status updates.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                className="h-12 text-base"
                autoFocus
              />
              <Button
                type="submit"
                className="w-full h-11"
                disabled={!trackingNumber.trim()}
              >
                <Search className="mr-2 h-4 w-4" /> Track Shipment
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Your tracking number starts with <span className="font-mono font-medium">TPC</span> followed by a date and sequence number.
        </p>
      </div>
    </main>
  );
}
