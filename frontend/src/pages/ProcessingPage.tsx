"use client"

import { useState } from "react"
import { useOrders } from "@/hooks/useApi"
import { useProcessing, useCreateWeighment, useCreateProduction } from "@/hooks/useApi"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const weighmentSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  grossWeight: z.string().min(1, "Gross weight is required"),
  tareWeight: z.string().default("0"),
  unit: z.enum(["KG", "QUINTAL", "TONNE"]),
  moisturePercentage: z.string().default("0"),
})

const productionSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  operatorName: z.string().optional(),
  machineInfo: z.string().optional(),
  qualityRemarks: z.string().optional(),
  productionNotes: z.string().optional(),
})

export default function ProcessingPage() {
  const { data } = useOrders()
  const { data: processingData } = useProcessing()
  const weighmentMutation = useCreateWeighment()
  const productionMutation = useCreateProduction()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"weighment" | "production">("weighment")

  const orders = data?.data || []
  const weighments = processingData?.data || []

  const weighmentForm = useForm({
    resolver: zodResolver(weighmentSchema),
    defaultValues: { orderId: "", grossWeight: "", tareWeight: "0", unit: "KG", moisturePercentage: "0" },
  })

  const productionForm = useForm({
    resolver: zodResolver(productionSchema),
    defaultValues: { orderId: "", operatorName: "", machineInfo: "", qualityRemarks: "", productionNotes: "" },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Processing</h1>
          <p className="text-muted-foreground">Manage chura processing and weighments</p>
        </div>
        <div className="flex gap-2">
          <Button variant={tab === "weighment" ? "default" : "outline"} onClick={() => setTab("weighment")}>
            Weighment
          </Button>
          <Button variant={tab === "production" ? "default" : "outline"} onClick={() => setTab("production")}>
            Production
          </Button>
        </div>
      </div>

      {tab === "weighment" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Weighment Records</h2>
            <Button onClick={() => setOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" /> Record Weighment
            </Button>
          </div>
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Gross Weight</TableHead>
                  <TableHead>Tare Weight</TableHead>
                  <TableHead>Net Weight</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weighments.map((w: any) => (
                  <TableRow key={w.id}>
                    <TableCell>{w.orderId}</TableCell>
                    <TableCell>{w.grossWeight}</TableCell>
                    <TableCell>{w.tareWeight}</TableCell>
                    <TableCell className="font-medium">{w.netWeight}</TableCell>
                    <TableCell>{w.unit}</TableCell>
                    <TableCell>{new Date(w.recordedAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {weighments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                      No weighment records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold">Production Records</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {orders.map((order: any) => (
              <div key={order.id} className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold">{order.orderId}</h3>
                <p className="text-sm text-muted-foreground">{order.customer?.name || "—"}</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    productionForm.setValues({ orderId: order.id })
                    setOpen(true)
                  }}
                  className="w-full mt-3"
                >
                  Record Production
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "weighment" && (
        <div className="fixed inset-0 z-50" aria-hidden={!open ? "true" : undefined}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed left-[50%] top-[10%] z-50 -translate-x-[50%] w-full max-w-md p-6 bg-background border overflow-y-auto max-h-[80vh]">
            <form onSubmit={weighmentForm.handleSubmit((values) => {
              weighmentMutation.mutate(values)
              weighmentForm.reset()
              setOpen(false)
            })} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderId">Order</Label>
                <select id="orderId" {...weighmentForm.register("orderId")} className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select order</option>
                  {orders.map((o: any) => (
                    <option key={o.id} value={o.id}>{o.orderId} - {o.customer?.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grossWeight">Gross Weight</Label>
                  <Input id="grossWeight" type="number" step="0.01" {...weighmentForm.register("grossWeight")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tareWeight">Tare Weight</Label>
                  <Input id="tareWeight" type="number" step="0.01" {...weighmentForm.register("tareWeight")} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <select id="unit" {...weighmentForm.register("unit")} className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="KG">Kilogram</option>
                  <option value="QUINTAL">Quintal</option>
                  <option value="TONNE">Tonne</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="moisturePercentage">Moisture %</Label>
                <Input id="moisturePercentage" type="number" step="0.01" {...weighmentForm.register("moisturePercentage")} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={weighmentMutation.isPending}>
                  Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {tab === "production" && (
        <div className="fixed inset-0 z-50" aria-hidden={!open ? "true" : undefined}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed left-[50%] top-[10%] z-50 -translate-x-[50%] w-full max-w-md p-6 bg-background border overflow-y-auto max-h-[80vh]">
            <form onSubmit={productionForm.handleSubmit((values) => {
              productionMutation.mutate(values)
              productionForm.reset()
              setOpen(false)
            })} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderId">Order</Label>
                <select id="orderId" {...productionForm.register("orderId")} className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select order</option>
                  {orders.map((o: any) => (
                    <option key={o.id} value={o.id}>{o.orderId} - {o.customer?.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="operatorName">Operator Name</Label>
                <Input id="operatorName" {...productionForm.register("operatorName")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="machineInfo">Machine Info</Label>
                <Input id="machineInfo" {...productionForm.register("machineInfo")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualityRemarks">Quality Remarks</Label>
                <Input id="qualityRemarks" {...productionForm.register("qualityRemarks")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productionNotes">Production Notes</Label>
                <Input id="productionNotes" {...productionForm.register("productionNotes")} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={productionMutation.isPending}>
                  Save Production
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
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
