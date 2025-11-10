import type {Database as DataBaseType, Transaction} from "better-sqlite3"
import Database from "better-sqlite3";
import {afterEach, beforeEach, describe, expect, it} from "vitest";


import {initServiceCreator} from "@/db/queries/Services/createService.js";
import {initServiceReader} from "@/db/queries/Services/readServices.js";
import {initServiceUpdater} from "@/db/queries/Services/updateService.js";
import {initServiceDeleter} from "@/db/queries/Services/deleteService.js";

import {createTables, createTriggers} from "@/db/index.js";

import type {SiteInput, ServerInput} from "@/db/queries/Services/Services.types.ts";
import type {SiteType, ServerType, ServiceType} from "@/db/queries/Services/Services.types.js";
import type {ServiceQueryFilter} from "@/db/queries/Services/Services.types.ts";

import {sleep} from "@/utils/sleep.js";

describe('Service-related table tests', () => {
    // create an in-memory database for testing
    let testDB: DataBaseType;

    let createSiteTransaction: Transaction<(input: SiteInput) => bigint | number>;
    let createServerTransaction: Transaction<(input: ServerInput) => bigint | number>;

    let readServiceById: (serviceId: number | bigint) => ServerType | SiteType
    let readServicesByFilter: (filter: ServiceQueryFilter) => ServiceType[]

    let updateSiteTransaction: Transaction<(service_id: number | bigint, input: Omit<SiteInput, "type">) => bigint | number>;
    let updateServerTransaction: Transaction<(service_id: number | bigint, input: Omit<ServerInput, "type">) => bigint | number>

    let deleteServiceTransaction:  Transaction<(id: number | bigint) => bigint | number>;

    const mockSiteInput : SiteInput = {
        name: "mock-site",
        type: "static-site",
        // group_id: undefined,
        region: "us-east-1",
        repoId: "e-hua/CloudWrap",
        branchName: "dev",
        rootDir: ".",

        siteBucketName: "mock-site-CloudWrap-bucket",
        buildCommand: "npm run build",
        publishDirectory: "dist",
    }

    const mockServerInput : ServerInput = {
        name: "mock-server",
        type: "server",
        // group_id: undefined,
        region: "us-east-1",
        repoId: "e-hua/CloudWrap",
        branchName: "dev",
        rootDir: ".",

        containerPort: 8080,
        instanceType: "t3.nano",
        dockerfilePath: "Dockerfile",
        secretHeaderValue: "123"
    }

    const selectAllFromServiceFilter: ServiceQueryFilter = {
        names: [],
        types: [],
        groupIds: [],
        regions: []
    }

    beforeEach(() => {
        testDB = new Database(':memory:')
        createTables(testDB);
        createTriggers(testDB);

        // parentheses are required
        ({createSiteTransaction, createServerTransaction} = initServiceCreator(testDB));
        ({readServiceById, readServicesByFilter} = initServiceReader(testDB));
        ({updateSiteTransaction, updateServerTransaction} = initServiceUpdater(testDB));
        ({deleteServiceTransaction} = initServiceDeleter(testDB))
    })

    afterEach(() => {
        testDB.close();
    })

    describe('CRUD Operations about Services', () => {

        it('should CREATE site and READ it using its ID', () => {
            // CREATE
            const siteServiceId = createSiteTransaction(mockSiteInput)
            // should return the new id in the table correctly
            expect(siteServiceId).toBe(1);


            // READ
            const retrievedSite: SiteType = readServiceById(siteServiceId) as SiteType
            // console.log(retrievedSite)
            expect(retrievedSite).toBeDefined()
            expect(retrievedSite.name).toBe(mockSiteInput.name)
            expect(retrievedSite.type).toBe(mockSiteInput.type)
            expect(retrievedSite.publishDirectory).toBe(mockSiteInput.publishDirectory)
        })

        it('should CREATE server and READ it using its ID', () => {
            // CREATE
            const serverServiceId = createServerTransaction(mockServerInput)
            // should return the new id in the table correctly
            expect(serverServiceId).toBe(1);

            // READ
            const retrievedServer: ServerType = readServiceById(serverServiceId) as ServerType
            // console.log(retrievedServer)
            expect(retrievedServer).toBeDefined()
            expect(retrievedServer.name).toBe(mockServerInput.name)
            expect(retrievedServer.type).toBe(mockServerInput.type)
            expect(retrievedServer.containerPort).toBe(mockServerInput.containerPort)
        })

        it('should CREATE multiple services and FILTER them correctly', () => {
            // CREATE
            const siteServiceId = createSiteTransaction(mockSiteInput)
            const serverServiceId = createServerTransaction(mockServerInput)
            // should return the new id in the table correctly
            expect(siteServiceId).toBe(1);
            expect(serverServiceId).toBe(2);

            // FILTER
            const retrievedServices: ServiceType[] = readServicesByFilter(selectAllFromServiceFilter) as ServiceType[]
            expect(retrievedServices.length).toBe(2)

            const siteOnlyFilter = {
                ...selectAllFromServiceFilter,
                types: ["static-site"],
                regions: ["us-east-1"]
            }

            const onlySiteServices: ServiceType[] = readServicesByFilter(siteOnlyFilter) as ServiceType[]
            expect(onlySiteServices.length).toBe(1)
        })

        it('should UPDATE site correctly', () => {
            // CREATE
            const siteServiceId = createSiteTransaction(mockSiteInput)

            const mockUpdateSiteInput: Omit<SiteInput, "type"> = {
                ...mockSiteInput,
                name: "new-mock-site",
                buildCommand: "vite build"
            }

            // UPDATE
            updateSiteTransaction(siteServiceId, mockUpdateSiteInput)
            const updatedSite: SiteType= readServiceById(siteServiceId) as SiteType

            expect(updatedSite.name).toBe(mockUpdateSiteInput.name)
            expect(updatedSite.buildCommand).toBe(mockUpdateSiteInput.buildCommand)
        })

        it('should UPDATE server correctly', () => {
            // CREATE
            const serverServiceId = createServerTransaction(mockServerInput)

            const mockUpdateServerInput: Omit<ServerInput, "type"> = {
                ...mockServerInput,
                name: "new-mock-server",
                dockerfilePath: "src/Dockerfile"
            }

            // UPDATE
            updateServerTransaction(serverServiceId, mockUpdateServerInput)
            const updatedServer: ServerType= readServiceById(serverServiceId) as ServerType

            expect(updatedServer.name).toBe(mockUpdateServerInput.name)
            expect(updatedServer.dockerfilePath).toBe(mockUpdateServerInput.dockerfilePath)
        })

        it ('should DELETE services and FILTER them correctly', () => {
            // CREATE
            const siteServiceId = createSiteTransaction(mockSiteInput)
            // should return the new id in the table correctly
            expect(siteServiceId).toBe(1);


            // READ: Data exists before deletion
            const retrievedServices: ServiceType[] = readServicesByFilter(selectAllFromServiceFilter) as ServiceType[]
            console.log(retrievedServices)
            expect(retrievedServices.length).toBe(1)

            // DELETE
            const deletedId = deleteServiceTransaction(siteServiceId)
            expect(deletedId).toBe(siteServiceId)
            const deletedServices: ServiceType[] = readServicesByFilter(selectAllFromServiceFilter) as ServiceType[]
            expect(deletedServices.length).toBe(0)
        })
    })

    describe('Triggers about Services', () => {
        it('should UPDATE the updateAt correctly', async () => {
            // CREATE
            const siteServiceId = createSiteTransaction(mockSiteInput)

            await sleep(1000);
            const mockUpdateSiteInput: Omit<SiteInput, "type"> = {
                ...mockSiteInput,
                name: "new-mock-site",
                buildCommand: "vite build"
            }

            // UPDATE
            updateSiteTransaction(siteServiceId, mockUpdateSiteInput)
            const updatedSite: SiteType= readServiceById(siteServiceId) as SiteType

            // Assert that the updatedAt is not createdAt
            expect(updatedSite.updatedAt).not.toBe(updatedSite.createdAt)
        })
    })
})
