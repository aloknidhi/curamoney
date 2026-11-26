"use client"

import { useState } from "react"
import { useOrders, useCreateOrder, useUpdateOrderStatus } from "@/hooks/useApi"
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

const orderSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  orderDate: z.string().min(1, "Date is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  weightUnit: z.enum(["KG", "QUINTAL", "TONNE"]),
  processingCharges: z.string().default("0"),
  additionalCharges: z.string().default("0"),
  discount: z.string().default("0"),
  expectedCompletionDate: z.string().optional(),
})

export default function OrdersPage() {
  const { data } = useOrders()
  const { data: customersData } = useCustomers()
  const createMutation = useCreateOrder()
  const statusMutation = useUpdateOrderStatus()
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof orderSchema>>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customerId: "",
      orderDate: new Date().toISOString().split("T")[0],
      quantity: 1,
      weightUnit: "KG",
      processingCharges: "0",
      additionalCharges: "0",
      discount: "0",
    },
  })

  const orders = data?.data || []
  const customers = customersData?.data || []

  const onSubmit = (values: z.infer<typeof orderSchema>) => {
    createMutation.mutate(values)
    form.reset()
    setOpen(false)
  }

  const statusColors: Record<string, string> = {
    ORDER_RECEIVED: "bg-blue-100 text-blue-800",
    WEIGHMENT_DONE: "bg-purple-100 text-purple-800",
    PROCESSING: "bg-yellow-100 text-yellow-800",
    PRODUCTION_DONE: "bg-green-100 text-green-800",
    READY_FOR_DELIVERY: "bg-indigo-100 text-indigo-800",
    DELIVERED: "bg-emerald-100 text-emerald-800",
    CLOSED: "bg-neutral-100 text-neutral-800",
    CANCELLED: "bg-red-100 text-red-800",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Order
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order: any) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.orderId}</TableCell>
                <TableCell>{order.customer?.name || "—"}</TableCell>
                <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                <TableCell>{order.quantity} {order.weightUnit}</TableCell>
                <TableCell className="font-medium">₹{order.finalAmount}</TableCell>
                <TableCell>
                  <Badge className={statusColors[order.status] || "bg-neutral-100 text-neutral-800"}>
                    {order.status.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => statusMutation.mutate({ id: order.id, status: "PROCESSING" })}
                  >
                    Start Processing
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                  No orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="fixed inset-0 z-50" aria-hidden={!open ? "true" : undefined}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className="fixed left-[50%] top-[10%] z-50 -translate-x-[50%] w-full max-w-lg p-6 bg-background border overflow-y-auto max-h-[80vh]">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Customer</Label>
                <select {...form.register("customerId")} className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select customer</option>
                  {customers.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>
                  ))}
                </select>
                {form.formState.errors.customerId && (
                  <p className="text-sm text-destructive">{form.formState.errors.customerId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Order Date</Label>
                <Input type="date" {...form.register("orderDate")} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" {...form.register("quantity")} />
              </div>
              <div className="space-y-2">
                <Label>Weight Unit</Label>
                <select {...form.register("weightUnit")} className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="KG">Kilogram (KG)</option>
                  <option value="QUINTAL">Quintal</option>
                  <option value="TONNE">Tonne</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Processing Charges (₹)</Label>
                <Input {...form.register("processingCharges")} />
              </div>
              <div className="space-y-2">
                <Label>Additional Charges (₹)</Label>
                <Input {...form.register("additionalCharges")} />
              </div>
              <div className="space-y-2">
                <Label>Discount (₹)</Label>
                <Input {...form.register("discount")} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Create Order
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-neutral-700 mb-1">
      {children}
    </label>
  )
}
