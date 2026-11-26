import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { prisma } from "../src/config/prisma"

const seed = async () => {
  const passwordHash = await bcrypt.hash("admin123", 12)

  // Owner role
  const ownerRole = await prisma.role.upsert({
    where: { name: "OWNER" },
    update: {},
    create: { name: "OWNER", description: "Full access" },
  })
  const managerRole = await prisma.role.upsert({
    where: { name: "MANAGER" },
    update: {},
    create: { name: "MANAGER", description: "Manage customers, orders, processing" },
  })
  const operatorRole = await prisma.role.upsert({
    where: { name: "OPERATOR" },
    update: {},
    create: { name: "OPERATOR", description: "View assigned orders, update processing" },
  })
  const accountantRole = await prisma.role.upsert({
    where: { name: "ACCOUNTANT" },
    update: {},
    create: { name: "ACCOUNTANT", description: "Manage payments, expenses, financial reports" },
  })

  // Owner user
  const owner = await prisma.user.upsert({
    where: { email: "admin@curamoney.com" },
    update: {},
    create: {
      email: "admin@curamoney.com",
      passwordHash,
      name: "Mill Owner",
      mobile: "9876543210",
      roleId: ownerRole.id,
    },
  })

  // Default permissions
  const perms = [
    "customers.view", "customers.create", "customers.edit", "customers.delete",
    "orders.view", "orders.create", "orders.edit", "orders.delete", "orders.status",
    "processing.view", "processing.create", "processing.edit",
    "payments.view", "payments.create", "payments.reverse",
    "deliveries.view", "deliveries.create",
    "expenses.view", "expenses.create", "expenses.edit",
    "reports.view",
    "settings.view", "settings.edit",
    "users.view", "users.create", "users.edit", "users.disable",
  ]
  for (const p of perms) {
    const [resource, action] = p.split(".")
    await prisma.permission.upsert({
      where: { name: p },
      update: {},
      create: { name: p, resource, action },
    })
  }

  // Grant all permissions to OWNER
  const allPerms = await prisma.permission.findMany()
  for (const p of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: ownerRole.id, permissionId: p.id } },
      update: {},
      create: { roleId: ownerRole.id, permissionId: p.id },
    })
  }

  // Default processing stages
  const stages = [
    { name: "Order Received", slug: "order_received", sequence: 1, isDefault: true },
    { name: "Weighment Completed", slug: "weighment_completed", sequence: 2 },
    { name: "Waiting in Queue", slug: "waiting_in_queue", sequence: 3 },
    { name: "Processing Started", slug: "processing_started", sequence: 4 },
    { name: "Processing Completed", slug: "processing_completed", sequence: 5 },
    { name: "Quality Check", slug: "quality_check", sequence: 6 },
    { name: "Ready for Delivery", slug: "ready_for_delivery", sequence: 7 },
    { name: "Partially Delivered", slug: "partially_delivered", sequence: 8 },
    { name: "Fully Delivered", slug: "fully_delivered", sequence: 9 },
    { name: "Closed", slug: "closed", sequence: 10 },
    { name: "On Hold", slug: "on_hold", sequence: 99 },
    { name: "Cancelled", slug: "cancelled", sequence: 100 },
  ]
  for (const s of stages) {
    await prisma.processingStage.upsert({
      where: { slug: s.slug },
      update: {},
      create: s,
    })
  }

  // Expense categories
  const categories = ["Electricity", "Labour", "Machine Maintenance", "Transportation", "Packaging", "Fuel", "Rent", "Other"]
  for (const c of categories) {
    await prisma.expenseCategory.upsert({
      where: { name: c },
      update: {},
      create: { name: c },
    })
  }

  // Business settings
  const settings = [
    { key: "mill_name", value: "CuraMoney Chura Mill", category: "BUSINESS" },
    { key: "owner_name", value: "Mill Owner", category: "BUSINESS" },
    { key: "mobile", value: "9876543210", category: "BUSINESS" },
    { key: "address", value: "Mill Address, Village, District", category: "BUSINESS" },
    { key: "gst_number", value: "", category: "BUSINESS" },
    { key: "currency", value: "INR", category: "BUSINESS" },
    { key: "timezone", value: "Asia/Kolkata", category: "BUSINESS" },
    { key: "weight_units", value: "KG,QUINTAL,TONNE", category: "OPERATIONAL" },
    { key: "payment_methods", value: "CASH,UPI,BANK_TRANSFER,OTHER", category: "OPERATIONAL" },
  ]
  for (const s of settings) {
    await prisma.businessSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    })
  }

  console.log("Seed complete. Owner: admin@curamoney.com / admin123")
}

seed().catch((e) => {
  console.error(e)
  process.exit(1)
})
