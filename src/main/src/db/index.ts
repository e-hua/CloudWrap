// The entry point of our SQLite DB
import Database from "better-sqlite3";
import type {Database as DataBaseType} from "better-sqlite3"
import {initServiceCreator} from "@/db/queries/Services/createService.js";
import {initServiceReader} from "@/db/queries/Services/readServices.js";
import {initServiceDeleter} from "@/db/queries/Services/deleteService.js";
import {initServiceUpdater} from "@/db/queries/Services/updateService.js";
import path from "path";
import { app } from "electron";

const dbPath = path.join(app.getPath('userData'), 'cloudwrap.db');
const db : DataBaseType = new Database(dbPath, { verbose: console.log });

// Though not required, it is generally important to set the WAL pragma for performance reasons
db.pragma('journal_mode = WAL');

// This is a must if we want to enforce the FK constraint
db.pragma('foreign_keys = ON');

function createTables(db: DataBaseType) {
  // language=SQLite
  const createServiceGroups = `
    CREATE TABLE IF NOT EXISTS ServiceGroups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `;

  // language=SQLite
  const createServices = `
    CREATE TABLE IF NOT EXISTS Services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      -- some derived attributes
        -- siteBucketName: {name}-site-bucket
        -- pipelineName: {name}-pipeline
        -- codeBuildName: {name}-build
      name TEXT UNIQUE NOT NULL ,
      type TEXT NOT NULL ,
      -- This can be NULL, a service can have no group
      group_id INTEGER REFERENCES ServiceGroups(id),
      region TEXT,
      createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      repoId TEXT NOT NULL,
      branchName TEXT NOT NULL,
      rootDir TEXT NOT NULL,
      -- This is the default CloudFront domain name allocated by CloudWrap
      cloudFrontDomainName TEXT UNIQUE NOT NULL
    );
  `;

  // language=SQLite
  const createStaticSiteServices = `
    CREATE TABLE IF NOT EXISTS StaticSiteServices (  
      service_id INTEGER PRIMARY KEY REFERENCES Services(id) NOT NULL,
      buildCommand TEXT NOT NULL ,
      publishDirectory TEXT NOT NULL ,
      customizedDomainName TEXT,
      acmCertificateARN TEXT
    );
  `;

  // language=SQLite
  const createServerServices = `
    CREATE TABLE IF NOT EXISTS ServerServices (
      service_id INTEGER PRIMARY KEY REFERENCES Services(id) NOT NULL,
      containerPort INTEGER NOT NULL,
      instanceType TEXT NOT NULL,
      dockerfilePath TEXT NOT NULL,
      secretHeaderValue TEXT NOT NULL 
    );
  `;

  db.exec(createServiceGroups)
  db.exec(createServices)
  db.exec(createStaticSiteServices)
  db.exec(createServerServices)
}

function createTriggers(db: DataBaseType) {
  // language=SQLite
  const create_services_updated_at = `
    CREATE TRIGGER IF NOT EXISTS t_services_updated_at
    -- This is to prevent the infinite loop

    -- This will only be triggered 
    -- when we're not updating the updatedAt column
    AFTER UPDATE 
        OF name, type, group_id, region, repoId, branchName, rootDir 
        ON Services
    WHEN old.updatedAt = new.updatedAt
    BEGIN 
        UPDATE Services
        SET updatedAt = CURRENT_TIMESTAMP
        WHERE id = old.id;
    END;
  `

  db.exec(create_services_updated_at)
}

createTables(db)
createTriggers(db)

// Inject the dependencies
const serviceCreator = initServiceCreator(db)
const serviceReader = initServiceReader(db)
const serviceUpdater = initServiceUpdater(db)
const serviceDeleter = initServiceDeleter(db)

export {serviceCreator, serviceReader, serviceUpdater, serviceDeleter}
export {createTables, createTriggers}
