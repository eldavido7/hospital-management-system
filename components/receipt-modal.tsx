"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/data/billing";
import { useAppStore } from "@/lib/data/store";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "./ui/toaster";

interface ReceiptModalProps {
  billId: string | null;
  open: boolean;
  onClose: () => void;
}

export function ReceiptModal({ billId, open, onClose }: ReceiptModalProps) {
  const { toast } = useToast();
  const { getBillById, calculateTotal } = useAppStore();

  const bill = billId ? getBillById(billId) : null;

  if (!bill) {
    return null;
  }

  const handlePrintReceipt = () => {
    toast({
      title: "Printing receipt",
      description: "The receipt is being sent to the printer.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {bill.status === "paid" ? "Receipt" : "Bill"} #{bill.id}
          </DialogTitle>
          <DialogDescription>
            Patient: {bill.patientName} (ID: {bill.patientId})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p>{bill.status === "paid" ? bill.paymentDate : bill.date}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="capitalize">{bill.type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant="outline"
                className={
                  bill.status === "paid"
                    ? "bg-green-50 text-green-800"
                    : bill.status === "cancelled"
                    ? "bg-red-50 text-red-800"
                    : "bg-blue-50 text-blue-800"
                }
              >
                {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
              </Badge>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price (₦)</TableHead>
                  <TableHead className="text-right">Total (₦)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.description}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.unitPrice.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {(item.quantity * item.unitPrice).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {bill.total
                      ? formatCurrency(bill.total)
                      : formatCurrency(calculateTotal(bill.items))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {bill.discount && bill.discount > 0 && bill.originalTotal && (
            <div className="p-4 bg-gray-50 rounded-md mb-4">
              <h3 className="text-lg font-semibold mb-2">Discount Applied</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Discount Type</p>
                  <p>{bill.discountReason || "Staff Discount"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Discount Percentage
                  </p>
                  <p>{bill.discount}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Original Amount
                  </p>
                  <p>{formatCurrency(bill.originalTotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Discount Amount
                  </p>
                  <p className="text-green-600">
                    -
                    {formatCurrency(bill.originalTotal * (bill.discount / 100))}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {bill.status === "paid" && (
            <Button onClick={handlePrintReceipt}>
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
      <Toaster />
    </Dialog>
  );
}
