import type {Transaction} from "better-sqlite3";

import type {Database as DataBaseType} from "better-sqlite3"
import type {ServerInput, SiteInput} from "@/db/queries/Services/Services.types.js";

// language=SQLite
const updateService = `
    -- Notice that we cannot modify "type" or "id" here
    UPDATE Services
    SET name = @name, 
        group_id = @group_id,
        region = @region,
        repoId = @repoId,
        branchName = @branchName,
        rootDir = @rootDir
    WHERE id = @id 
`

// language=SQLite
const updateSite = `    
    UPDATE StaticSiteServices
    SET siteBucketName = @siteBucketName,
        buildCommand = @buildCommand,
        publishDirectory = @publishDirectory,
        domainName = @domainName,
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

    const updateSiteTransaction : Transaction<(service_id: number | bigint, input: Omit<SiteInput, "type">) => bigint | number> =
        db.transaction((service_id: number | bigint, input: Omit<SiteInput, "type">) => {
            const {name, group_id, region, repoId, branchName, rootDir,
                siteBucketName, buildCommand, publishDirectory, domainName, acmCertificateARN} = input

            updateServiceStmt.run({
                id: service_id,
                name,
                group_id: group_id || null,
                region,
                repoId,
                branchName,
                rootDir
            })

            updateSiteStmt.run({
                service_id,
                siteBucketName,
                buildCommand,
                publishDirectory,
                domainName: domainName || null,
                acmCertificateARN: acmCertificateARN || null
            })

            return service_id
        })

    const updateServerTransaction: Transaction<(service_id: number | bigint, input: Omit<ServerInput, "type">) => bigint | number> =
        db.transaction((service_id: number | bigint, input: Omit<ServerInput, "type">)  => {
            const {name, group_id, region, repoId, branchName, rootDir,
                containerPort, instanceType, dockerfilePath, secretHeaderValue} = input

            updateServiceStmt.run({
                id: service_id,
                name,
                group_id: group_id || null,
                region,
                repoId,
                branchName,
                rootDir
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