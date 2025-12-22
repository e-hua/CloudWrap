import { z } from "zod";

const createServiceSchema = z.object({
  githubConnectionArn: z.string(),

  projectName: z.string(),
  // siteBucketName: derived => ${projectName}-site-bucket
  githubRepoId: z.string(),
  githubBranchName: z.string(),
  rootDirectory: z.string(),
  groupId: z.number().optional(),
});

const createSiteSchema = z.object({
  ...createServiceSchema.shape,
  buildCommand: z.string(),
  publishDirectory: z.string(),

  customizedDomainName: z.union([z.string(), z.null()]).optional(),
  acmCertificateArn: z.union([z.string(), z.null()]).optional(),
});

const createServerSchema = z.object({
  ...createServiceSchema.shape,
  container_port: z.number(),
  instance_type: z.string(),
  dockerfile_path: z.string(),
});

// Only keep the githubConnectionArn required
// All the other attributes are optional
const updateSiteSchema = createSiteSchema.partial().extend({
  githubConnectionArn: z.string(),
});

const updateServerSchema = createServerSchema.partial().extend({
  githubConnectionArn: z.string(),
});

const createSitePayloadSchema = z.object({
  ...createSiteSchema.shape,
  type: z.literal("static-site"),
});

const createServerPayloadSchema = z.object({
  ...createServerSchema.shape,
  type: z.literal("server"),
});

const updateSitePayloadSchema = z.object({
  ...updateSiteSchema.shape,
  type: z.literal("static-site"),
});

const updateServerPayloadSchema = z.object({
  ...updateServerSchema.shape,
  type: z.literal("server"),
});

const createServicePayloadSchema = z.discriminatedUnion("type", [
  createSitePayloadSchema,
  createServerPayloadSchema,
]);

const updateServicePayloadSchema = z.discriminatedUnion("type", [
  updateSitePayloadSchema,
  updateServerPayloadSchema,
]);

const deleteServicePayloadSchema = z.object({
  type: z.union([z.literal("static-site"), z.literal("server")]),
  githubConnectionArn: z.string(),
});

// These are for the service layer
type CreateServiceInput = z.infer<typeof createServiceSchema>;
type CreateStaticSiteInput = z.infer<typeof createSiteSchema>;
type CreateServerInput = z.infer<typeof createServerSchema>;
type UpdateStaticSiteInput = z.infer<typeof updateSiteSchema>;
type UpdateServerInput = z.infer<typeof updateServerSchema>;

export { createSiteSchema, createServerSchema };
export { updateSiteSchema, updateServerSchema };
export type { CreateStaticSiteInput, CreateServerInput };
export type { UpdateStaticSiteInput, UpdateServerInput };

// These are for the controllers
type CreateStaticSitePayload = z.infer<typeof createSitePayloadSchema>;
type CreateServerPayload = z.infer<typeof createServerPayloadSchema>;
type CreateServicePayload = z.infer<typeof createServicePayloadSchema>;
type UpdateStaticSitePayload = z.infer<typeof updateSitePayloadSchema>;
type UpdateServerPayload = z.infer<typeof updateServerPayloadSchema>;
type UpdateServicePayload = z.infer<typeof updateServicePayloadSchema>;
type DeleteServicePayload = z.infer<typeof deleteServicePayloadSchema>;

export {
  createSitePayloadSchema,
  createServerPayloadSchema,
  createServicePayloadSchema,
};
export {
  updateSitePayloadSchema,
  updateServerPayloadSchema,
  updateServicePayloadSchema,
};
export { deleteServicePayloadSchema };

export type {
  CreateStaticSitePayload,
  CreateServerPayload,
  CreateServicePayload,
};
export type {
  UpdateStaticSitePayload,
  UpdateServerPayload,
  UpdateServicePayload,
};
export type { DeleteServicePayload };
