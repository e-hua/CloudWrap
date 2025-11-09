import type {Transaction} from "better-sqlite3";
import type {Database as DataBaseType} from "better-sqlite3"
import type {ServerInput, SiteInput} from "@/db/queries/Services/Services.types.js";

// language=SQLite
const insertService = `
    INSERT INTO Services(name, type, group_id, region, repoId, branchName, rootDir)
    VALUES (@name, @type, @group_id, @region, @repoId, @branchName, @rootDir);
`

// language=SQLite
const insertStaticSite = `
    INSERT INTO StaticSiteServices(service_id, siteBucketName, buildCommand, publishDirectory, domainName, acmCertificateARN)
    VALUES (@service_id, @siteBucketName, @buildCommand, @publishDirectory, @domainName, @acmCertificateARN)
`

// language=SQLite
const insertServer = `
    INSERT INTO ServerServices(service_id, containerPort, instanceType, dockerfilePath, secretHeaderValue)
    VALUES (@service_id, @containerPort, @instanceType, @dockerfilePath, @secretHeaderValue)
`

function initServiceCreator(db: DataBaseType) {
    const insertServiceStmt = db.prepare(insertService)
    const insertSiteStmt = db.prepare(insertStaticSite)
    const insertServerStmt = db.prepare(insertServer)

    const createSiteTransaction: Transaction<(input: SiteInput) => bigint | number> =
        db.transaction((input: SiteInput) => {
            const {name, type, group_id, region, repoId, branchName, rootDir,
                siteBucketName, buildCommand, publishDir, domainName, acmCertificateARN} = input
            const serviceInsertionRunResult = insertServiceStmt.run({
                name,
                type,
                group_id: group_id || null,
                region,
                repoId,
                branchName,
                rootDir
            })

            const service_id = serviceInsertionRunResult.lastInsertRowid;
            insertSiteStmt.run({
                service_id,
                siteBucketName,
                buildCommand,
                publishDirectory: publishDir,
                domainName: domainName || null,
                acmCertificateARN: acmCertificateARN || null
            })

            return service_id
        })

    const createServerTransaction: Transaction<(input: ServerInput) => bigint | number> =
        db.transaction((input: ServerInput) => {
            const {name, type, group_id, region, repoId, branchName, rootDir,
                containerPort, instanceType, dockerfilePath, secretHeaderValue} = input

            const serviceInsertionRunResult = insertServiceStmt.run({
                name,
                type,
                group_id: group_id || null,
                region,
                repoId,
                branchName,
                rootDir
            })

            const service_id = serviceInsertionRunResult.lastInsertRowid;
            insertServerStmt.run({
                service_id,
                containerPort,
                instanceType,
                dockerfilePath,
                secretHeaderValue
            })

            return service_id
        })

    return  {createSiteTransaction, createServerTransaction}
}

export {initServiceCreator}