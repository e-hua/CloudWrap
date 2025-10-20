import { useEffect, useState } from "react";
import { createBucket, fetchBuckets, type Bucket } from "@/apis/s3";
import AccentButton from "@/components/ui/AccentButton";
import Button from "@/components/ui/Button";
import S3ServiceCard from "@/components/S3ServiceCard";
import { Plus } from "lucide-react";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

export default function StoragePage() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");

  useEffect(() => {
    (async () => {
      // In the future there might be some
      // Authentication tricks with http-only cookies
      // To get the ARN
      try {
        const fetchedBuckets = await fetchBuckets();

        if (!fetchedBuckets) {
          throw new Error("Buckets not available");
        }

        // An array of objects: {Name: , CreationDate}
        setBuckets(fetchedBuckets);
      } catch (error) {
        console.error(error);
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
          <Input
            // sync it with react state
            value={inputVal}
            // Sync react state with it
            onChange={(event) => setInputVal(event.target.value)}
          />
        </div>
        <div className="flex flex-row justify-end gap-5">
          <Button
            text={"Cancel"}
            variation={"secondary"}
            onClick={() => setModalOpen(false)}
          />
          <Button
            text={"Create"}
            variation={"default"}
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
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
          {storageSpecification}
        </Modal>
      </div>

      <p className="text-text-secondary">
        Store and retrieve any amount of data from anywhere
      </p>
      <div className="flex flex-col gap-y-5">
        {buckets.map((elem, idx) => {
          return (
            <S3ServiceCard
              serviceType="storage"
              serviceName={elem.Name}
              creationDate={elem.CreationDate}
              serviceProvider="AWS"
              key={idx}
            />
          );
        })}
      </div>
    </div>
  );
}
