"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/components/ui/input-otp";
import { trpc } from "~/trpc/client";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

  const requestOtpMutation = trpc.customerAuth.requestOtp.useMutation({
    onSuccess: () => {
      setStep("otp");
      setResendCountdown(60);
      toast.success("OTP sent to your phone");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const verifyOtpMutation = trpc.customerAuth.verifyOtp.useMutation({
    onSuccess: () => {
      router.push("/portal/shipments");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    const cleanPhone = phone.replace(/\s+/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      toast.error("Enter a valid 10-digit Indian phone number");
      return;
    }
    requestOtpMutation.mutate({ phone: cleanPhone });
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the complete 6-digit OTP");
      return;
    }
    const cleanPhone = phone.replace(/\s+/g, "");
    verifyOtpMutation.mutate({ phone: cleanPhone, otp });
  }

  function handleResend() {
    const cleanPhone = phone.replace(/\s+/g, "");
    requestOtpMutation.mutate({ phone: cleanPhone });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl">TPC India</CardTitle>
          <CardDescription>
            {step === "phone"
              ? "Enter your registered phone number"
              : `Enter the 6-digit code sent to +91 ${phone}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    +91
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={12}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={requestOtpMutation.isPending}
              >
                {requestOtpMutation.isPending ? "Sending..." : "Send OTP"}
              </Button>
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Admin login
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                  autoFocus
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={verifyOtpMutation.isPending || otp.length !== 6}
              >
                {verifyOtpMutation.isPending ? "Verifying..." : "Verify & Login"}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                {resendCountdown > 0 ? (
                  <span>Resend OTP in {resendCountdown}s</span>
                ) : (
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={handleResend}
                    disabled={requestOtpMutation.isPending}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
              <div className="text-center">
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:underline flex items-center gap-1 mx-auto"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                  }}
                >
                  <ArrowLeft className="h-3 w-3" /> Change number
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
