import type {Database as DataBaseType} from "better-sqlite3"
import type {Transaction} from "better-sqlite3";

// language=SQLite
const deleteService = `
    DELETE FROM Services
    WHERE id = @id;
`

// language=SQLite
const deleteServer = `
    DELETE FROM ServerServices
    WHERE service_id = @service_id;
`;

// language=SQLite
const deleteSite = `
    DELETE FROM StaticSiteServices
    WHERE service_id = @service_id;
`;

// language=SQLite
const getServiceTypeQuery= `
        SELECT type 
        FROM Services
        WHERE id = ?
`;

function initServiceDeleter(db: DataBaseType) {
    const typeStmt = db.prepare(getServiceTypeQuery)
    const deleteServiceStmt = db.prepare(deleteService)
    const deleteServerStmt = db.prepare(deleteServer)
    const deleteSiteStmt = db.prepare(deleteSite)

    const deleteServiceTransaction: Transaction<(id: number) => bigint | number> =
        db.transaction((id: number) => {
            const serviceType = typeStmt.get(id) as { type: string } | undefined

            if (!serviceType) {
                throw new Error(`Service ID ${id} not exists in the table`)
            }


            switch (serviceType.type) {
                case "server":
                    deleteServerStmt.run({service_id: id})
                    break
                case "static-site":
                    deleteSiteStmt.run({service_id: id})
                    break
                default:
                    throw new Error(`Unknown service type: ${serviceType.type}`)
            }

            const deletionInfo = deleteServiceStmt.run({id})
            if (deletionInfo.changes === 0) {
                throw new Error(`Failed to delete service with ID ${id}`)
            }

            return id;
        })
    return {deleteServiceTransaction}
}

export {initServiceDeleter}