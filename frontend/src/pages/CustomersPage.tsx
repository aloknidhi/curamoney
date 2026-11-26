"use client"

import { useState } from "react"
import { useCustomers, useCreateCustomer, useUpdateCustomer } from "@/hooks/useApi"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().min(1, "Mobile is required"),
  address: z.string().optional(),
})

export default function CustomersPage() {
  const { data } = useCustomers()
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const form = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", mobile: "", address: "" },
  })

  const customers = data?.data || []

  const onSubmit = (values: z.infer<typeof customerSchema>) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values })
    } else {
      createMutation.mutate(values)
    }
    form.reset()
    setOpen(false)
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your mill customers</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer: any) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.customerId}</TableCell>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.mobile}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{customer.address || "—"}</TableCell>
                <TableCell>{customer._count?.orders || 0}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => {
                    setEditingId(customer.id)
                    form.setValues({ name: customer.name, mobile: customer.mobile, address: customer.address || "" })
                    setOpen(true)
                  }}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-4">
                  No customers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="fixed inset-0 z-50" aria-hidden={!open ? "true" : undefined}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className="fixed left-[50%] top-[50%] z-50 -translate-x-[50%] -translate-y-[50%] w-full max-w-md p-6 bg-background border">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile</Label>
              <Input id="mobile" {...form.register("mobile")} />
              {form.formState.errors.mobile && (
                <p className="text-sm text-destructive">{form.formState.errors.mobile.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...form.register("address")} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Update" : "Create"}
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
