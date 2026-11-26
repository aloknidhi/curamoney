"use client"

import { useState } from "react"
import { useExpenses, useCreateExpense, useExpenseCategories } from "@/hooks/useApi"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const expenseSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required"),
  expenseDate: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  reference: z.string().optional(),
})

export default function ExpensesPage() {
  const { data } = useExpenses()
  const { data: categoriesData } = useExpenseCategories()
  const createMutation = useCreateExpense()
  const [open, setOpen] = useState(false)

  const form = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      categoryId: "",
      amount: "",
      expenseDate: new Date().toISOString().split("T")[0],
      description: "",
      reference: "",
    },
  })

  const expenses = data?.data || []
  const categories = categoriesData?.data || []

  const onSubmit = (values: z.infer<typeof expenseSchema>) => {
    createMutation.mutate(values)
    form.reset()
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track business expenses</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((e: any) => (
              <TableRow key={e.id}>
                <TableCell>{e.category?.name || e.categoryId}</TableCell>
                <TableCell className="font-medium">₹{e.amount}</TableCell>
                <TableCell>{new Date(e.expenseDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.description || "—"}</TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                  No expenses found
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
              <Label>Category</Label>
                <select {...form.register("categoryId")} className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select category</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" step="0.01" {...form.register("amount")} />
            </div>
            <div className="space-y-2">
              <Label>Expense Date</Label>
              <Input type="date" {...form.register("expenseDate")} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...form.register("description")} />
            </div>
            <div className="space-y-2">
              <Label>Reference</Label>
              <Input {...form.register("reference")} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Add Expense
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
