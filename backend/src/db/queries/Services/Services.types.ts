type DBServiceInput = {
    name: string;
    type: "static-site" | "server";
    group_id: number | undefined;
    region: string;
    repoId: string;
    branchName: string;
    rootDir: string;
    cloudFrontDomainName: string;
}

type DBSiteInput = DBServiceInput & {
    type: "static-site";
    buildCommand: string;
    publishDirectory: string;
    customizedDomainName: string | undefined;
    acmCertificateARN: string | undefined;
}

type DBServerInput = DBServiceInput & {
    type: "server";
    containerPort: number;
    instanceType: string;
    dockerfilePath: string;
    secretHeaderValue: string;
}

type DBServiceOutput = {
    id: number;
    createdAt: string;
    updatedAt: string;
}

type DBServiceType = DBServiceInput & DBServiceOutput

type DBServerType = DBServerInput & DBServiceOutput;

type DBSiteType = DBSiteInput & DBServiceOutput;


export type {DBServiceInput, DBSiteInput, DBServerInput}
export type {DBServiceType, DBSiteType, DBServerType};