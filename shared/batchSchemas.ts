import { z } from 'zod'

const id = z.string().trim().min(1).max(200)
const title = z.string().trim().min(1).max(300)
const money = z.number().finite().nonnegative().max(1e12)
const date = z.iso.date()
const metadata = z.record(z.string(), z.unknown()).nullable()
const common = { id: id.optional(), householdId: id.optional() }
const reference = id.nullable().optional()
const entry = z.object({
  ...common, title: title.optional(), description: z.string().max(10000).optional(),
  amount: money.optional(), kind: z.enum(['income', 'expense']).optional(),
  dueDate: date.optional(), competenceDate: date.optional(),
  ruleId: reference, accountId: reference, categoryId: reference,
  status: z.enum(['pending', 'paid', 'review']).optional(), origin: z.enum(['auto', 'manual', 'imported']).optional(),
  installmentIndex: z.number().int().min(1).max(1200).nullable().optional(),
  installmentTotal: z.number().int().min(1).max(1200).nullable().optional(),
  excludeFromCalc: z.boolean().optional(), metadata: metadata.optional(),
  createdAt: z.iso.datetime().optional(), updatedAt: z.iso.datetime().optional(),
}).strict()
const account = z.object({
  ...common, name: title.optional(), owner: z.string().max(300).optional(),
  type: z.enum(['bank', 'credit_card', 'benefit', 'external']).optional(),
  limitTotal: money.nullable().optional(), active: z.boolean().optional(),
  dueDay: z.number().int().min(1).max(31).nullable().optional(),
  closingDay: z.number().int().min(1).max(31).nullable().optional(),
}).strict()
const rule = z.object({
  ...common, title: title.optional(), description: z.string().max(10000).optional(),
  accountId: reference, categoryId: reference, amount: money.optional(),
  kind: z.enum(['income', 'expense']).optional(), dueDay: z.number().int().min(1).max(31).nullable().optional(),
  frequency: z.enum(['monthly', 'manual']).optional(), startsAt: date.optional(), endsAt: date.nullable().optional(),
  autoGenerate: z.boolean().optional(), metadata: metadata.optional(),
}).strict()
const webUrl = z.url({ protocol: /^https?$/ }).max(2048).nullable().optional()
const wish = z.object({
  ...common, name: title.optional(), price: money.nullable().optional(), url: webUrl, imageUrl: webUrl,
  notes: z.string().max(10000).nullable().optional(), category: z.string().max(300).nullable().optional(),
  priority: z.enum(['high', 'medium', 'low']).optional(), status: z.enum(['want', 'saving', 'bought']).optional(),
  createdAt: z.iso.datetime().optional(), updatedAt: z.iso.datetime().optional(),
}).strict()
const batch = <T extends z.ZodType>(item: T) => z.object({
  upserts: z.array(item).max(1000).default([]), deletes: z.array(id).max(1000).default([]),
}).strict()
export const entryBatchSchema = batch(entry)
export const accountBatchSchema = batch(account)
export const ruleBatchSchema = batch(rule)
export const wishBatchSchema = batch(wish)
