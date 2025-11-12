import type {Database as DataBaseType} from "better-sqlite3"
import type {DBSiteType, DBServerType, DBServiceType} from "@/db/queries/Services/Services.types.js";
import type {DBServiceQueryFilter} from "@/db/queries/Services/Services.schema.js";
// language=SQLite
const getServiceTypeQuery= `
        SELECT type 
        FROM Services
        WHERE id = ?
    `;

// language=SQLite
const getStaticSiteQuery = `
        SELECT * 
        FROM StaticSiteServices Sites JOIN Services S on S.id = Sites.service_id
        WHERE Sites.service_id = ?
    `

// language=SQLite
const getServerQuery = `
        SELECT * 
        FROM ServerServices Servers JOIN Services S on S.id = Servers.service_id
        WHERE Servers.service_id = ?
    `

// These are for dependency injections
function initServiceReader(db: DataBaseType) {
    // prepared statements are reusable, can be used multiple times
    const typeStmt = db.prepare(getServiceTypeQuery)
    const siteStmt = db.prepare(getStaticSiteQuery)
    const serverStmt = db.prepare(getServerQuery)

    function readServiceById(serviceId: number | bigint): DBServerType | DBSiteType {
        const serviceType = typeStmt.get(serviceId)

        const assertedServiceWithType = serviceType as {type: string}

        if (!assertedServiceWithType || !assertedServiceWithType.type) {
            throw new Error(`Service not found with serviceId: ${serviceId}`)
        }

        switch (assertedServiceWithType.type) {
            case "server":
                return serverStmt.get(serviceId) as DBServerType
            case "static-site":
                return siteStmt.get(serviceId) as DBSiteType
            default:
                throw new Error(`Unknown service type: ${assertedServiceWithType.type}`)
        }
    }

    function readServicesByFilter(filter: DBServiceQueryFilter): DBServiceType[] {
        const {names, types, groupIds, regions, createdBefore, createdAfter, updatedBefore, updatedAfter} = filter

        // language=SQLite
        let query = `
        SELECT * 
        FROM Services
    `;

        const whereClauses = []
        const params = []

        if (names && names.length > 0) {
            // Placeholder examples: `?, ?, ?`
            const placeHolders = names.map(elem => "?").join(", ")

            // In Clause: `name in (?, ?, ?)`
            const inClause = `name IN (${placeHolders})`
            whereClauses.push(inClause)
            params.push(...names)
        }

        if (types && types.length > 0) {
            const placeHolders = types.map(elem => "?").join(", ")

            // In Clause: `type in (?, ?, ?)`
            const inClause = `type IN (${placeHolders})`
            whereClauses.push(inClause)
            params.push(...types)
        }

        if (groupIds && groupIds.length > 0) {
            const placeHolders = groupIds.map(elem => "?").join(", ")

            // In Clause: `group_id in (?, ?, ?)`
            const inClause = `group_id IN (${placeHolders})`
            whereClauses.push(inClause)
            params.push(...groupIds)
        }

        if (regions && regions.length > 0) {
            const placeHolders = regions.map(elem => "?").join(", ")

            // In Clause: `region in (?, ?, ?)`
            const inClause = `region IN (${placeHolders})`
            whereClauses.push(inClause)
            params.push(...regions)
        }

        if (createdBefore) {
            whereClauses.push("createdAt <= ?")
            params.push(createdBefore.toISOString())
        }

        if (createdAfter) {
            whereClauses.push("createdAt >= ?")
            params.push(createdAfter.toISOString())
        }

        if (updatedBefore)  {
            whereClauses.push("updatedAt <= ?")
            params.push(updatedBefore.toISOString())
        }

        if (updatedAfter)  {
            whereClauses.push("updatedAt >= ?")
            params.push(updatedAfter.toISOString())
        }

        if (whereClauses.length > 0) {
            query += `WHERE ${whereClauses.join(` AND `)}`
        }


        const stmt = db.prepare(query);
        const services = stmt.all(...params)
        return services as DBServiceType[]
    }

    return {readServiceById, readServicesByFilter}
}

export {initServiceReader}