type ServiceInput = {
    name: string;
    type: "static-site" | "server";
    group_id?: number;
    region: string;
    repoId: string;
    branchName: string;
    rootDir: string;
}

type SiteInput = ServiceInput & {
    type: "static-site";
    siteBucketName: string;
    buildCommand: string;
    publishDirectory: string;
    domainName?: string;
    acmCertificateARN?: string;
}

type ServerInput = ServiceInput & {
    type: "server";
    containerPort: number;
    instanceType: string;
    dockerfilePath: string;
    secretHeaderValue: string;
}

type ServiceOutput = {
    id: number;
    createdAt: string;
    updatedAt: string;
}

type ServiceType = ServiceInput & ServiceOutput

type ServerType = ServerInput & ServiceOutput;

type SiteType = SiteInput & ServiceOutput;




type ServiceQueryFilter = {
    names: string[];
    types: string[];
    groupIds: number[];
    regions: string[];
    createdBefore?: Date;
    createdAfter?: Date;
    updatedBefore?: Date;
    updatedAfter?: Date;
}

export type {ServiceInput, SiteInput, ServerInput}
export type {ServiceType, SiteType, ServerType};
export type {ServiceQueryFilter}