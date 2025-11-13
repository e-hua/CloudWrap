import type {Database as DataBaseType, Transaction} from "better-sqlite3"
import Database from "better-sqlite3";
import {afterEach, beforeEach, describe, expect, it} from "vitest";


import {initServiceCreator} from "@/db/queries/Services/createService.js";
import {initServiceReader} from "@/db/queries/Services/readServices.js";
import {initServiceUpdater} from "@/db/queries/Services/updateService.js";
import {initServiceDeleter} from "@/db/queries/Services/deleteService.js";

import {createTables, createTriggers} from "@/db/index.js";

import type {DBSiteInput, DBServerInput} from "@/db/queries/Services/Services.types.ts";
import type {DBSiteType, DBServerType, DBServiceType} from "@/db/queries/Services/Services.types.js";
import type {DBServiceQueryFilter} from "@/db/queries/Services/Services.schema.js";

import {sleep} from "@/utils/sleep.js";

describe('Service-related table tests', () => {
  // create an in-memory database for testing
  let testDB: DataBaseType;

  let createSiteTransaction: Transaction<(input: DBSiteInput) => bigint | number>;
  let createServerTransaction: Transaction<(input: DBServerInput) => bigint | number>;

  let readServiceById: (serviceId: number | bigint) => DBServerType | DBSiteType
  let readServicesByFilter: (filter: DBServiceQueryFilter) => DBServiceType[]

  let updateSiteTransaction: Transaction<(service_id: number | bigint, input: Omit<DBSiteInput, "type">) => bigint | number>;
  let updateServerTransaction: Transaction<(service_id: number | bigint, input: Omit<DBServerInput, "type">) => bigint | number>

  let deleteServiceTransaction:  Transaction<(id: number | bigint) => bigint | number>;

  const mockSiteInput : DBSiteInput = {
    name: "mock-site",
    type: "static-site",
    group_id: undefined,
    region: "us-east-1",
    repoId: "e-hua/CloudWrap",
    branchName: "dev",
    rootDir: ".",
    cloudFrontDomainName: "123.cloudfront.net",

    buildCommand: "npm run build",
    publishDirectory: "dist",
    customizedDomainName: undefined,
    acmCertificateARN: undefined
  }

  const mockServerInput : DBServerInput = {
    name: "mock-server",
    type: "server",
    group_id: undefined,
    region: "us-east-1",
    repoId: "e-hua/CloudWrap",
    branchName: "dev",
    rootDir: ".",
    cloudFrontDomainName: "456.cloudfront.net",

    containerPort: 8080,
    instanceType: "t3.nano",
    dockerfilePath: "Dockerfile",
    secretHeaderValue: "123"
  }

  const selectAllFromServiceFilter: DBServiceQueryFilter = {
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
      const retrievedSite: DBSiteType = readServiceById(siteServiceId) as DBSiteType
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
      const retrievedServer: DBServerType = readServiceById(serverServiceId) as DBServerType
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
      const retrievedServices: DBServiceType[] = readServicesByFilter(selectAllFromServiceFilter) as DBServiceType[]
      expect(retrievedServices.length).toBe(2)

      const siteOnlyFilter = {
        ...selectAllFromServiceFilter,
        types: ["static-site"],
        regions: ["us-east-1"]
      }

      const onlySiteServices: DBServiceType[] = readServicesByFilter(siteOnlyFilter) as DBServiceType[]
      expect(onlySiteServices.length).toBe(1)
    })

    it('should UPDATE site correctly', () => {
      // CREATE
      const siteServiceId = createSiteTransaction(mockSiteInput)

      const mockUpdateSiteInput: Omit<DBSiteInput, "type"> = {
        ...mockSiteInput,
        repoId: "e-hua/new-repo",
        buildCommand: "vite build"
      }

      // UPDATE
      updateSiteTransaction(siteServiceId, mockUpdateSiteInput)
      const updatedSite: DBSiteType= readServiceById(siteServiceId) as DBSiteType

      expect(updatedSite.repoId).toBe(mockUpdateSiteInput.repoId)
      expect(updatedSite.buildCommand).toBe(mockUpdateSiteInput.buildCommand)
    })

    it('should UPDATE server correctly', () => {
      // CREATE
      const serverServiceId = createServerTransaction(mockServerInput)

      const mockUpdateServerInput: Omit<DBServerInput, "type"> = {
        ...mockServerInput,
        repoId: "e-hua/new-repo",
        dockerfilePath: "src/Dockerfile"
      }

      // UPDATE
      updateServerTransaction(serverServiceId, mockUpdateServerInput)
      const updatedServer: DBServerType= readServiceById(serverServiceId) as DBServerType

      expect(updatedServer.repoId).toBe(mockUpdateServerInput.repoId)
      expect(updatedServer.dockerfilePath).toBe(mockUpdateServerInput.dockerfilePath)
    })

    it ('should DELETE services and FILTER them correctly', () => {
      // CREATE
      const siteServiceId = createSiteTransaction(mockSiteInput)
      // should return the new id in the table correctly
      expect(siteServiceId).toBe(1);


      // READ: Data exists before deletion
      const retrievedServices: DBServiceType[] = readServicesByFilter(selectAllFromServiceFilter) as DBServiceType[]
      console.log(retrievedServices)
      expect(retrievedServices.length).toBe(1)

      // DELETE
      const deletedId = deleteServiceTransaction(siteServiceId)
      expect(deletedId).toBe(siteServiceId)
      const deletedServices: DBServiceType[] = readServicesByFilter(selectAllFromServiceFilter) as DBServiceType[]
      expect(deletedServices.length).toBe(0)
    })
  })

  describe('Triggers about Services', () => {
    it('should UPDATE the updateAt correctly', async () => {
      // CREATE
      const siteServiceId = createSiteTransaction(mockSiteInput)

      await sleep(1000);
      const mockUpdateSiteInput: Omit<DBSiteInput, "type"> = {
        ...mockSiteInput,
        name: "new-mock-site",
        buildCommand: "vite build"
      }

      // UPDATE
      updateSiteTransaction(siteServiceId, mockUpdateSiteInput)
      const updatedSite: DBSiteType= readServiceById(siteServiceId) as DBSiteType

      // Assert that the updatedAt is not createdAt
      expect(updatedSite.updatedAt).not.toBe(updatedSite.createdAt)
    })
  })
})
