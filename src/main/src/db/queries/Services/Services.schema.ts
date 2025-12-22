import {z} from "zod"

const dbServiceQueryFilterSchema = z.object({
  // names in the query params might come in with two different types
  // an array of strings: ["a", "b"], or just a string: "a"
  names: z.preprocess(val => Array.isArray(val) ? val : [val], z.array(z.string())).optional(),
  types: z.preprocess(val => Array.isArray(val) ? val : [val], z.array(z.string())).optional(),
  groupIds: z.preprocess(
      (val) => (Array.isArray(val) ? val : [val]),
      z.array(z.coerce.number().int().positive())
  ).optional(),
  regions: z.preprocess(val => Array.isArray(val) ? val : [val], z.array(z.string())).optional(),
  createdBefore: z.coerce.date().optional(),
  createdAfter: z.coerce.date().optional(),
  updatedBefore: z.coerce.date().optional(),
  updatedAfter: z.coerce.date().optional()
})

type DBServiceQueryFilter = z.infer<typeof dbServiceQueryFilterSchema>

export {dbServiceQueryFilterSchema}
export type {DBServiceQueryFilter}

