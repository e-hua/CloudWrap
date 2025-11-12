import type {Transaction} from "better-sqlite3";

import type {Database as DataBaseType} from "better-sqlite3"
import type {DBServerInput, DBSiteInput} from "@/db/queries/Services/Services.types.js";

// language=SQLite
const updateService = `
    -- Notice that we cannot modify "type" or "id" here
    -- Neither can we modify the "name", since there are many attributes derived from it 
    UPDATE Services
    SET group_id = @group_id,
        region = @region,
        repoId = @repoId,
        branchName = @branchName,
        rootDir = @rootDir,
        cloudFrontDomainName = @cloudFrontDomainName
    WHERE id = @id 
`

// language=SQLite
const updateSite = `    
    UPDATE StaticSiteServices
    SET buildCommand = @buildCommand,
        publishDirectory = @publishDirectory,
        customizedDomainName = @customizedDomainName,
        acmCertificateARN = @acmCertificateARN
    WHERE service_id = @service_id;
`

// language=SQLite
const updateServer = `
    UPDATE ServerServices
    SET containerPort = @containerPort,
        instanceType = @instanceType, 
        dockerfilePath = @dockerfilePath,
        secretHeaderValue = @secretHeaderValue
    WHERE service_id = @service_id;
`

function initServiceUpdater(db: DataBaseType) {
    const updateServiceStmt = db.prepare(updateService)
    const updateSiteStmt = db.prepare(updateSite)
    const updateServerStmt = db.prepare(updateServer)

    const updateSiteTransaction : Transaction<(service_id: number | bigint, input: Omit<DBSiteInput, "type" | "name">) => bigint | number> =
        db.transaction((service_id: number | bigint, input: Omit<DBSiteInput, "type" | "name">) => {
            const {group_id, region, repoId, branchName, rootDir,
                buildCommand, publishDirectory, customizedDomainName, acmCertificateARN, cloudFrontDomainName} = input

            updateServiceStmt.run({
                id: service_id,
                group_id: group_id || null,
                region,
                repoId,
                branchName,
                rootDir,
                cloudFrontDomainName
            })

            updateSiteStmt.run({
                service_id,
                buildCommand,
                publishDirectory,
                customizedDomainName: customizedDomainName || null,
                acmCertificateARN: acmCertificateARN || null
            })

            return service_id
        })

    const updateServerTransaction: Transaction<(service_id: number | bigint, input: Omit<DBServerInput, "type" | "name">) => bigint | number> =
        db.transaction((service_id: number | bigint, input: Omit<DBServerInput, "type" | "name">)  => {
            const {group_id, region, repoId, branchName, rootDir,
                containerPort, instanceType, dockerfilePath, secretHeaderValue, cloudFrontDomainName} = input

            updateServiceStmt.run({
                id: service_id,
                group_id: group_id || null,
                region,
                repoId,
                branchName,
                rootDir,
                cloudFrontDomainName
            })

            updateServerStmt.run({
                service_id,
                containerPort,
                instanceType,
                dockerfilePath,
                secretHeaderValue
            })

            return service_id
        })

    return {updateSiteTransaction, updateServerTransaction}
}

export {initServiceUpdater}