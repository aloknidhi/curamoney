"use client"

import { useState } from "react"
import { usePayments, useCreatePayment } from "@/hooks/useApi"
import { useCustomers } from "@/hooks/useApi"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const paymentSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  orderId: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  type: z.enum(["DEBIT", "CREDIT"]),
  paymentMethod: z.string().min(1, "Payment method is required"),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().min(1, "Date is required"),
})

export default function PaymentsPage() {
  const { data } = usePayments()
  const { data: customersData } = useCustomers()
  const createMutation = useCreatePayment()
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      customerId: "",
      orderId: "",
      amount: "",
      type: "DEBIT",
      paymentMethod: "CASH",
      reference: "",
      notes: "",
      paymentDate: new Date().toISOString().split("T")[0],
    },
  })

  const payments = data?.data || []
  const customers = customersData?.data || []

  const onSubmit = (values: z.infer<typeof paymentSchema>) => {
    createMutation.mutate(values)
    form.reset()
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Record and track customer payments</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Record Payment
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.paymentId}</TableCell>
                <TableCell>{p.customer?.name || "—"}</TableCell>
                <TableCell>
                  <Badge className={p.type === "DEBIT" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                    {p.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">₹{p.amount}</TableCell>
                <TableCell>{p.paymentMethod}</TableCell>
                <TableCell>{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {payments.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                  No payments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="fixed inset-0 z-50" aria-hidden={!open ? "true" : undefined}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className="fixed left-[50%] top-[10%] z-50 -translate-x-[50%] w-full max-w-md p-6 bg-background border overflow-y-auto max-h-[80vh]">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Customer</Label>
                <select {...form.register("customerId")} className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select customer</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>
                  ))}
                </select>
            </div>
            <div className="space-y-2">
              <Label>Order (optional)</Label>
                <select {...form.register("orderId")} className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">No order</option>
                </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <Input type="number" step="0.01" {...form.register("amount")} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select {...form.register("type")} className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="DEBIT">Debit (Payment Received)</option>
                  <option value="CREDIT">Credit (Refund/Issue)</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <select {...form.register("paymentMethod")} className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Reference</Label>
              <Input {...form.register("reference")} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" {...form.register("paymentDate")} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Record Payment
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-neutral-700 mb-1">{children}</label>
}
