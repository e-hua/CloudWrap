import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { fetchObjects, getObject, postObject } from "../apis/s3";
import {
  FolderClosed,
  HardDrive,
  File,
  Upload,
  Download,
  BrushCleaning,
} from "lucide-react";

import { parseFileList } from "../../utils/parseFileList";
import Breadcrumb from "../components/ui/BreadCrumb";
import Button from "../components/ui/Button";
import Checkbox from "../components/ui/Checkbox";

export default function StorageInfoPage() {
  const { storageName } = useParams();
  const [objects, setObjects] = useState();

  useEffect(() => {
    (async () => {
      try {
        const result = await fetchObjects(storageName);
        setObjects(result.Contents);
      } catch (err) {
        console.log(err);
      }
    })();
  }, [storageName]);

  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="flex flex-row items-center gap-2 text-text-secondary ">
        <HardDrive size={18} />
        <p className="font-mono text-sm">{"Cloud Storage".toUpperCase()}</p>
      </div>
      <h1 className="text-text-primary text-4xl ">{storageName}</h1>
      <FolderView objects={objects} storageName={storageName} />
    </div>
  );
}

function FolderView({ objects = [], storageName }) {
  const [searchParams, setSearchParams] = useSearchParams();
  // This is a lightweight "set" of names we selected
  const [selectedNames, setSelectedNames] = useState({});

  const toggleEntrySelectedState = (name) => {
    setSelectedNames((prev) => {
      if (!prev[name]) {
        return { ...prev, [name]: true };
      } else {
        const { [name]: _, ...newSelectedNames } = prev;
        return newSelectedNames;
      }
    });
  };

  const prefix = searchParams.get("prefix") ?? "";

  // Once the prefix is changed, the items to be displayed is also changed
  const filteredObjects = objects
    .filter((object) => {
      return object.Key.startsWith(prefix);
    })
    .map((elem) => {
      // This is to trigger the parse with files inside the folder
      return { ...elem, Key: elem.Key.replace(prefix, "") };
    });

  const itemsDisplayed = parseFileList(filteredObjects);

  return (
    <div
      className="rounded-md overflow-hidden 
    border-1 border-sidebar-border p-4
    flex flex-col gap-5"
    >
      <div className="flex flex-row justify-between">
        <Breadcrumb
          prefix={prefix}
          callback={(newPrefix) => setSearchParams({ prefix: newPrefix })}
        />
        <ControlPanel bucketName={storageName} selectedNames={selectedNames} />
      </div>
      <FileTable
        items={itemsDisplayed}
        toggleEntrySelectedState={toggleEntrySelectedState}
        setSelectedNames={setSelectedNames}
        selectedNames={selectedNames}
      />
    </div>
  );
}

function ControlPanel({ bucketName, selectedNames }) {
  const [searchParams, _] = useSearchParams();
  const prefix = searchParams.get("prefix") ?? "";

  const selectedNameCount = Object.keys(selectedNames).length;

  return (
    <div className="flex flex-row gap-5">
      <Button
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) {
              console.error("No file uploaded!");
            }
            await postObject(bucketName, file.name, file, prefix);
          };
          input.click();
        }}
        text="Upload"
        variation={"default"}
      >
        <Upload />
      </Button>

      <Button
        onClick={() => {
          if (selectedNameCount === 1) {
            (async () => {
              // To download one file using a temporary link
              const name = Object.keys(selectedNames)[0];
              const file = await getObject(bucketName, name);
              let link = document.createElement("a");
              link.setAttribute("download", name);
              link.href = URL.createObjectURL(file);
              // Only when the link is actually in the DOM
              document.body.appendChild(link);
              link.click();
              link.remove();
            })();
          }
        }}
        text="Download"
        variation={"default"}
        disabled={selectedNameCount !== 1}
      >
        <Download />
      </Button>
    </div>
  );
}

function FileTable({
  items,
  toggleEntrySelectedState,
  setSelectedNames,
  selectedNames,
}) {
  const [searchParams, _] = useSearchParams();
  const prefix = searchParams.get("prefix") ?? "";

  const itemsCount =
    items.files.length +
    items.folders.reduce(
      (accum, folder) => accum + folder.folderContents.length,
      0
    );

  const folderNames = items.folders.reduce((accumArr, folder) => {
    const folderFileNames = folder.folderContents.reduce((accum, file) => {
      accum.push(prefix + folder.name + file.Key);
      return accum;
    }, []);

    accumArr.push(...folderFileNames);
    return accumArr;
  }, []);

  // Add the files in the folders to the fileNameObjects
  const fileNameObjects = folderNames.reduce((obj, elem) => {
    obj[elem] = true;
    return obj;
  }, {});

  // Add all file names at this level to the fileNameObjects
  items.files.map((file) => {
    fileNameObjects[prefix + file.name] = true;
  });

  const selectNamesCount = Object.keys(selectedNames).length;
  const allSelected = selectNamesCount === itemsCount;
  const noneSelected = selectNamesCount === 0;

  const processCheckState = () => {
    if (allSelected) {
      return "checked";
    } else if (noneSelected) {
      return "unchecked";
    } else {
      return "halfchecked";
    }
  };

  return (
    <div>
      <table className="w-full text-text-secondary">
        <thead>
          <tr className="border-b-2 border-sidebar-border">
            <th className="border-r-2 border-sidebar-border">
              <div className="flex flex-row items-center gap-5">
                <Checkbox
                  checkState={processCheckState()}
                  onClick={() => {
                    if (!noneSelected) {
                      setSelectedNames({});
                    } else {
                      setSelectedNames(fileNameObjects);
                    }
                  }}
                />
                <p>Name</p>
              </div>
            </th>
            <th className="border-r-2 border-sidebar-border">Type</th>
            <th className="border-r-2 border-sidebar-border">Last modified</th>
            <th className="border-r-2 border-sidebar-border">Size</th>
            <th>Storage class</th>
          </tr>
        </thead>

        <tbody>
          {items.folders.map((folder, idx) => {
            return (
              <FileTableEntry
                item={folder}
                key={idx}
                toggleEntrySelectedState={toggleEntrySelectedState}
                globalSelected={folder.folderContents.every(
                  (file) => selectedNames[prefix + folder.name + file.Key]
                )}
              />
            );
          })}

          {items.files.map((file, idx) => {
            return (
              <FileTableEntry
                item={file}
                key={idx}
                toggleEntrySelectedState={toggleEntrySelectedState}
                globalSelected={selectedNames[prefix + file.name]}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FileTableEntry({ item, toggleEntrySelectedState, globalSelected }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const prefix = searchParams.get("prefix") ?? "";
  return (
    <tr
      className="text-text-secondary 
    border-b border-sidebar-border last:border-0
    h-12 text-center break-words"
    >
      <td>
        <div className="flex flex-row gap-2 items-center">
          <Checkbox
            onClick={() => {
              if (item.isFolder) {
                for (let file of item.folderContents) {
                  toggleEntrySelectedState(prefix + item.name + file.Key);
                }
              } else {
                toggleEntrySelectedState(prefix + item.name);
              }
            }}
            checkState={globalSelected ? "checked" : "unchecked"}
          />
          <div className="text-text-secondary">
            {item.isFolder ? <FolderClosed size={17} /> : <File size={17} />}
          </div>
          <p
            className="text-text-primary underline hover:text-accent"
            onClick={() => {
              if (item.isFolder) {
                setSearchParams({
                  prefix: `${prefix}${item.name}`,
                });
              }
            }}
          >
            {item.name}
          </p>
        </div>
      </td>
      <td>
        <p>{item.type}</p>
      </td>
      <td>
        <p>{item.lastModified.substring(0, 10)}</p>
      </td>
      <td>
        <p>{item.size}</p>
      </td>
      <td>
        <p>{item.storageClass.toLowerCase()}</p>
      </td>
    </tr>
  );
}
