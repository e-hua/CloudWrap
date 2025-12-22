import type {Transaction} from "better-sqlite3";
import type {Database as DataBaseType} from "better-sqlite3"
import type {DBServerInput, DBSiteInput} from "@/db/queries/Services/Services.types.js";

// language=SQLite
const insertService = `
    INSERT INTO Services(name, type, group_id, region, repoId, branchName, rootDir, cloudFrontDomainName)
    VALUES (@name, @type, @group_id, @region, @repoId, @branchName, @rootDir, @cloudFrontDomainName);
`

// language=SQLite
const insertStaticSite = `
    INSERT INTO StaticSiteServices(service_id, buildCommand, publishDirectory, customizedDomainName, acmCertificateARN)
    VALUES (@service_id, @buildCommand, @publishDirectory, @customizedDomainName, @acmCertificateARN)
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

    const createSiteTransaction: Transaction<(input: DBSiteInput) => bigint | number> =
        db.transaction((input: DBSiteInput) => {
            const {name, type, group_id, region, repoId, branchName, rootDir,
                buildCommand, publishDirectory, customizedDomainName, acmCertificateARN, cloudFrontDomainName} = input
            const serviceInsertionRunResult = insertServiceStmt.run({
                name,
                type,
                group_id: group_id || null,
                region,
                repoId,
                branchName,
                rootDir,
                cloudFrontDomainName
            })

            const service_id = serviceInsertionRunResult.lastInsertRowid;
            insertSiteStmt.run({
                service_id,
                buildCommand,
                publishDirectory,
                customizedDomainName: customizedDomainName || null,
                acmCertificateARN: acmCertificateARN || null
            })

            return service_id
        })

    const createServerTransaction: Transaction<(input: DBServerInput) => bigint | number> =
        db.transaction((input: DBServerInput) => {
            const {name, type, group_id, region, repoId, branchName, rootDir,
                containerPort, instanceType, dockerfilePath, secretHeaderValue, cloudFrontDomainName} = input

            const serviceInsertionRunResult = insertServiceStmt.run({
                name,
                type,
                group_id: group_id || null,
                region,
                repoId,
                branchName,
                rootDir,
                cloudFrontDomainName
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