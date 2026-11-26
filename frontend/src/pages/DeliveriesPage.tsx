"use client"

import { useState } from "react"
import { useDeliveries, useCreateDelivery } from "@/hooks/useApi"
import { useOrders } from "@/hooks/useApi"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const deliverySchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  deliveredQuantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  deliveredWeight: z.string().min(1, "Weight is required"),
  deliveryDate: z.string().min(1, "Date is required"),
  deliveryNotes: z.string().optional(),
  receivedBy: z.string().optional(),
})

export default function DeliveriesPage() {
  const { data } = useDeliveries()
  const { data: ordersData } = useOrders()
  const createMutation = useCreateDelivery()
  const [open, setOpen] = useState(false)

  const form = useForm({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      orderId: "",
      deliveredQuantity: 1,
      deliveredWeight: "",
      deliveryDate: new Date().toISOString().split("T")[0],
      deliveryNotes: "",
      receivedBy: "",
    },
  })

  const deliveries = data?.data || []
  const orders = ordersData?.data || []

  const onSubmit = (values: z.infer<typeof deliverySchema>) => {
    createMutation.mutate(values)
    form.reset()
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Deliveries</h1>
          <p className="text-muted-foreground">Track product deliveries to customers</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Delivery
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Delivery ID</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.map((d: any) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.deliveryId}</TableCell>
                <TableCell>{d.order?.orderId || d.orderId}</TableCell>
                <TableCell>{d.deliveredQuantity}</TableCell>
                <TableCell>{d.deliveredWeight}</TableCell>
                <TableCell>{new Date(d.deliveryDate).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {deliveries.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                  No deliveries found
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
              <Label>Order</Label>
                <select {...form.register("orderId")} className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select order</option>
                  {orders.map((o: any) => (
                    <option key={o.id} value={o.id}>{o.orderId} - {o.customer?.name}</option>
                  ))}
                </select>
            </div>
            <div className="space-y-2">
              <Label>Delivered Quantity</Label>
              <Input type="number" {...form.register("deliveredQuantity")} />
            </div>
            <div className="space-y-2">
              <Label>Delivered Weight</Label>
              <Input {...form.register("deliveredWeight")} />
            </div>
            <div className="space-y-2">
              <Label>Delivery Date</Label>
              <Input type="date" {...form.register("deliveryDate")} />
            </div>
            <div className="space-y-2">
              <Label>Received By</Label>
              <Input {...form.register("receivedBy")} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input {...form.register("deliveryNotes")} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Record Delivery
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
