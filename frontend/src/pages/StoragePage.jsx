import { useEffect, useState } from "react";
import { createBucket, fetchBuckets } from "../apis/s3";
import ServiceCard from "../components/ServiceCard";
import AccentButton from "../components/AccentButton";
import { Plus } from "lucide-react";
import Modal from "../components/Modal";
import Button from "../components/Button";

export default function StoragePage() {
  const [buckets, setBuckets] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");

  useEffect(() => {
    (async () => {
      // In the future there might be some
      // Authentication tricks with http-only cookies
      // To get the ARN
      try {
        const fetchedBuckets = await fetchBuckets();

        // An array of objects: {Name: , CreationDate}
        setBuckets(fetchedBuckets);
      } catch (error) {
        console.log(error);
      }
    })();
  }, []);

  const plusIcon = <Plus />;

  const onCreateNewBucket = async function () {
    try {
      await createBucket(inputVal);
      setModalOpen(false);
    } catch (err) {
      console.log(err);
    }
  };

  const storageSpecification = (
    <div
      className="flex flex-col 
      items-center bg-strong 
      p-8
      text-text-primary
      rounded-lg
      border-1 border-sidebar-border"
    >
      <div className="flex flex-col gap-3">
        <h1 className="font-semibold text-xl">Create new bucket</h1>
        <div>
          <h2 className="text-sm">Bucket name</h2>
          <input
            // sync it with react state
            value={inputVal}
            // Sync react state with it
            onChange={(event) => setInputVal(event.target.value)}
            type="text"
            className="bg-surface-primary 
          border-1 border-sidebar-border
          focus:outline-none
          p-1 rounded-md"
          />
        </div>
        <div className="flex flex-row justify-end gap-5">
          <Button
            text={"Cancel"}
            style={"secondary"}
            onClick={() => setModalOpen(false)}
          />
          <Button
            text={"Create"}
            style={"default"}
            onClick={onCreateNewBucket}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col px-[15%] w-full h-full gap-y-2">
      <div className="flex flex-row justify-between mt-1">
        <h1 className="text-text-primary text-2xl font-bold">S3 buckets</h1>
        <div
          onClick={() => {
            setModalOpen(true);
          }}
        >
          <AccentButton icon={plusIcon} text="Add storage" />
        </div>
        <Modal isOpen={modalOpen}>{storageSpecification}</Modal>
      </div>
      <p className="text-text-secondary">
        Deploy your static websites or store documents here!
      </p>
      <div className="flex flex-col gap-y-5">
        {buckets.map((elem, idx) => {
          return (
            <ServiceCard
              serviceType="storage"
              serviceName={elem.Name}
              creationDate={elem.CreationDate}
              serviceProvider={"AWS"}
              key={idx}
            />
          );
        })}
      </div>
    </div>
  );
}
