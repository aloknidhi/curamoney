"use client"

import { useState } from "react"
import { useSettings, useUpsertSetting } from "@/hooks/useApi"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const settingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
})

export default function SettingsPage() {
  const { data } = useSettings()
  const upsertMutation = useUpsertSetting()
  const [open, setOpen] = useState(false)

  const form = useForm({
    resolver: zodResolver(settingSchema),
    defaultValues: { key: "", value: "", category: "", description: "" },
  })

  const settings = data?.data || []

  const onSubmit = (values: z.infer<typeof settingSchema>) => {
    upsertMutation.mutate(values)
    form.reset()
    setOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Business settings and configuration</p>
        </div>
        <Button onClick={() => setOpen(true)}>Add Setting</Button>
      </div>

      <div className="rounded-xl border">
        <div className="border-b">
          <div className="flex items-center gap-2 px-4 py-3">
            <Badge variant="outline" className="text-xs">Key</Badge>
            <Badge variant="outline" className="text-xs">Value</Badge>
            <Badge variant="outline" className="text-xs ml-auto">Category</Badge>
            <Badge variant="outline" className="text-xs ml-auto">Description</Badge>
          </div>
        </div>
        <div className="divide-y">
          {settings.map((s: any) => (
            <div key={s.id} className="flex items-center gap-2 px-4 py-3">
              <span className="text-sm font-mono w-48 truncate">{s.key}</span>
              <span className="text-sm">{s.value}</span>
              <span className="text-sm text-muted-foreground truncate w-48">{s.category}</span>
              <span className="text-sm text-muted-foreground ml-auto truncate w-64">{s.description || "—"}</span>
            </div>
          ))}
          {settings.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No settings configured
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-0 z-50" aria-hidden={!open ? "true" : undefined}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className="fixed left-[50%] top-[10%] z-50 -translate-x-[50%] w-full max-w-md p-6 bg-background border overflow-y-auto max-h-[80vh]">
          <h3 className="text-lg font-semibold mb-4">Add / Update Setting</h3>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Key</Label>
              <Input {...form.register("key")} />
              {form.formState.errors.key && <p className="text-sm text-destructive">{form.formState.errors.key.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Value</Label>
              <Input {...form.register("value")} />
              {form.formState.errors.value && <p className="text-sm text-destructive">{form.formState.errors.value.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input {...form.register("category")} />
              {form.formState.errors.category && <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...form.register("description")} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                Save
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
