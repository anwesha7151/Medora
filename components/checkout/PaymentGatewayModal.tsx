import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  Lock,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatMoney } from "@/services/medicines";

interface PaymentGatewayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  pharmacyName: string;
  onPaymentSuccess: (details: {
    method: "upi" | "card" | "netbanking" | "cod";
    transactionId: string;
  }) => void;
}

export function PaymentGatewayModal({
  open,
  onOpenChange,
  total,
  pharmacyName,
  onPaymentSuccess,
}: PaymentGatewayModalProps) {
  const [method, setMethod] = useState<"upi" | "card" | "netbanking" | "cod">(
    "upi",
  );
  const [processing, setProcessing] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("482910");
  const [cardNum, setCardNum] = useState("4532 •••• •••• 8841");
  const [cardExp, setCardExp] = useState("08/29");
  const [cardCvv, setCardCvv] = useState("892");
  const [selectedBank, setSelectedBank] = useState("HDFC Bank");

  const subtotal = Math.round((total / 1.12) * 100) / 100;
  const gst = Math.round((total - subtotal) * 100) / 100;

  const handlePay = () => {
    if (method === "card") {
      setOtpStep(true);
      return;
    }

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const txnId = `TXN-${method.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
      toast.success("Payment verified successfully!", {
        description: `₹${total.toFixed(2)} authorized via ${method.toUpperCase()} (${txnId})`,
      });
      onPaymentSuccess({ method, transactionId: txnId });
      onOpenChange(false);
    }, 1200);
  };

  const handleOtpVerify = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setOtpStep(false);
      const txnId = `TXN-CARD-${Math.floor(100000 + Math.random() * 900000)}`;
      toast.success("3D Secure Authentication Successful!", {
        description: `₹${total.toFixed(2)} charged to card (${txnId})`,
      });
      onPaymentSuccess({ method: "card", transactionId: txnId });
      onOpenChange(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-3xl p-6 sm:p-7">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Lock className="size-4" />
            </span>
            <div>
              <DialogTitle className="font-display text-lg font-extrabold text-ink">
                {otpStep
                  ? "3D Secure OTP Authentication"
                  : "Secure Payment Gateway"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {otpStep
                  ? "Enter the one-time passcode sent to your registered mobile number"
                  : `Encrypted 256-bit payment to ${pharmacyName}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {otpStep ? (
          <div className="space-y-5 py-3">
            <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Merchant:</span>
                <span className="font-semibold text-foreground">
                  Medora Healthcare / {pharmacyName}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Card Number:</span>
                <span className="font-mono font-semibold text-foreground">
                  {cardNum}
                </span>
              </div>
              <div className="flex justify-between text-xs border-t border-border/50 pt-2">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-display font-extrabold text-foreground">
                  {formatMoney(total)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                One-Time Password (OTP)
              </Label>
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="font-mono text-center text-lg tracking-widest font-bold"
                placeholder="482910"
              />
              <p className="text-[11px] text-muted-foreground text-center">
                Demo OTP pre-filled:{" "}
                <span className="font-mono font-bold text-foreground">
                  482910
                </span>
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOtpStep(false)}
                disabled={processing}
              >
                Back
              </Button>
              <Button
                size="sm"
                onClick={handleOtpVerify}
                disabled={processing || !otp}
                className="font-bold min-w-[140px]"
              >
                {processing
                  ? "Authorizing..."
                  : `Authorize ${formatMoney(total)}`}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Amount Summary Pill */}
            <div className="flex items-center justify-between rounded-2xl border-2 border-primary/20 bg-primary/5 p-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Total Payable
                </span>
                <div className="font-display text-2xl font-black text-ink">
                  {formatMoney(total)}
                </div>
              </div>
              <div className="text-right text-[11px] text-muted-foreground space-y-0.5">
                <div>Subtotal: {formatMoney(subtotal)}</div>
                <div>GST (12%): {formatMoney(gst)}</div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  Zero Convenience Fee
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Select Payment Mode
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setMethod("upi")}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition ${
                    method === "upi"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                      : "border-border/70 hover:border-primary/40 text-foreground"
                  }`}
                >
                  <Smartphone className="size-5 mb-1 text-primary" />
                  <span className="text-xs">Instant UPI</span>
                  <span className="text-[9px] text-muted-foreground font-normal">
                    QR & Apps
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("card")}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition ${
                    method === "card"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                      : "border-border/70 hover:border-primary/40 text-foreground"
                  }`}
                >
                  <CreditCard className="size-5 mb-1 text-primary" />
                  <span className="text-xs">Cards</span>
                  <span className="text-[9px] text-muted-foreground font-normal">
                    Debit / Credit
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("netbanking")}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition ${
                    method === "netbanking"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                      : "border-border/70 hover:border-primary/40 text-foreground"
                  }`}
                >
                  <Building className="size-5 mb-1 text-primary" />
                  <span className="text-xs">NetBanking</span>
                  <span className="text-[9px] text-muted-foreground font-normal">
                    All Banks
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("cod")}
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition ${
                    method === "cod"
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                      : "border-border/70 hover:border-primary/40 text-foreground"
                  }`}
                >
                  <Wallet className="size-5 mb-1 text-primary" />
                  <span className="text-xs">Pay on Pickup</span>
                  <span className="text-[9px] text-muted-foreground font-normal">
                    Cash / Card
                  </span>
                </button>
              </div>
            </div>

            {/* Dynamic Method Panel */}
            {method === "upi" && (
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="grid size-28 place-items-center rounded-xl border-2 border-dashed border-primary/40 bg-muted/40 p-2 shrink-0">
                    <QrCode className="size-20 text-primary" />
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left flex-1">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      Scan with any UPI App (GPay / PhonePe / Paytm)
                    </span>
                    <p className="text-xs text-muted-foreground">
                      UPI VPA:{" "}
                      <span className="font-mono font-bold text-foreground">
                        medora.healthcare@icici
                      </span>
                    </p>
                    <div className="flex gap-1.5 justify-center sm:justify-start pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] px-2.5"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            "medora.healthcare@icici",
                          );
                          toast.success("UPI ID copied to clipboard");
                        }}
                      >
                        <Copy className="size-3 mr-1" /> Copy VPA
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {method === "card" && (
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                    Card Number
                  </Label>
                  <Input
                    value={cardNum}
                    onChange={(e) => setCardNum(e.target.value)}
                    placeholder="4532 0000 0000 0000"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                      Expiry
                    </Label>
                    <Input
                      value={cardExp}
                      onChange={(e) => setCardExp(e.target.value)}
                      placeholder="MM/YY"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                      CVV
                    </Label>
                    <Input
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      type="password"
                      maxLength={3}
                      placeholder="•••"
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {method === "netbanking" && (
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                  Select Bank
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "HDFC Bank",
                    "ICICI Bank",
                    "State Bank of India",
                    "Axis Bank",
                  ].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setSelectedBank(b)}
                      className={`rounded-xl border p-2.5 text-xs text-left font-medium transition ${
                        selectedBank === b
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-border/70 text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {method === "cod" && (
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-1.5 text-xs text-muted-foreground">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <BadgeCheck className="size-4 text-primary" /> Pay at Counter
                  / on Delivery
                </p>
                <p>
                  You can pay via Cash, UPI QR or Card swipe when receiving your
                  medications at {pharmacyName}.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border/60 pt-3">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span>PCI-DSS Level 1 & RBI Tokenized</span>
              </div>
              <Button
                onClick={handlePay}
                disabled={processing}
                className="font-bold min-w-[160px]"
              >
                {processing
                  ? "Connecting Gateway..."
                  : method === "cod"
                    ? "Confirm Order"
                    : `Pay ${formatMoney(total)}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
