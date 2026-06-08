"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Search } from "lucide-react";

export function TrackSection() {
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
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-lg mx-auto">
      <Input
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
        placeholder="Enter tracking number (e.g. TPC20260101-00001)"
        className="h-12 text-base"
      />
      <Button type="submit" size="lg" className="h-12 px-6">
        <Search className="mr-2 h-4 w-4" /> Track
      </Button>
    </form>
  );
}
