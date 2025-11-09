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
    publishDir: string;
    secretHeaderValue: string;
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

export type {ServiceInput, SiteInput, ServerInput}