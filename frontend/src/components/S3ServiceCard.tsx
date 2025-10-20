import { HardDrive, Globe } from "lucide-react";
import { Link } from "react-router";
import { useNavigate } from "react-router";
import { Trash, Settings } from "lucide-react";
import { deleteBucket } from "@/apis/s3";
import Card, { CardEntry } from "@/components/ui/Card";

type S3ServiceCardProps = {
  serviceType: string;
  serviceName: string | undefined;
  creationDate: string | undefined;
  serviceProvider: string;
};

export default function S3ServiceCard({
  serviceType,
  serviceName = "-",
  creationDate = "-",
  serviceProvider,
}: S3ServiceCardProps) {
  const navigate = useNavigate();
  const serviceHeader = (
    <Link to={`/${serviceType}/${serviceName}`}>
      <h1 className="text-text-primary hover:text-accent text-sm underline">
        {serviceName}
      </h1>
    </Link>
  );
  const dropDownEntries = (
    <>
      <div
        className="flex gap-2 items-center text-text-primary py-1 px-2 hover:bg-button-hover"
        onClick={() => {
          navigate(`/${serviceType}/${serviceName}`);
        }}
      >
        <Settings size={17} />
        <p>Settings</p>
      </div>

      <div
        className="flex gap-2 items-center text-warning hover:bg-destructive py-1 px-2"
        onClick={() => deleteBucket(serviceName)}
      >
        <Trash size={17} />
        <p>Delete</p>
      </div>
    </>
  );

  const entires = (
    <>
      <CardEntry entryName={serviceType}>
        <ServiceTypeToIcon serviceType={serviceType} />
      </CardEntry>

      <CardEntry entryName="created at">
        <p className="text-text-primary text-xs">
          {creationDate.substring(0, 10)}
        </p>
      </CardEntry>

      <CardEntry entryName="provider">
        <ServiceProviderToIcon serviceProvider={serviceProvider} />
      </CardEntry>
    </>
  );

  return (
    <Card headerContent={serviceHeader} dropDownMenuContent={dropDownEntries}>
      {entires}
    </Card>
  );
}

function ServiceTypeToIcon({ serviceType }: { serviceType: string }) {
  if (serviceType === "storage") {
    return <HardDrive className="rounded-sm size-8 text-text-primary p-0.5" />;
  } else {
    return <Globe className="rounded-sm size-8 text-text-primary p-0.5" />;
  }
}

function ServiceProviderToIcon({
  serviceProvider,
}: {
  serviceProvider: string;
}) {
  if (serviceProvider === "AWS") {
    return (
      <div className="flex items-center rounded-sm size-8 text-text-primary p-0.5">
        <img src="/aws.svg" alt="AWS" />
      </div>
    );
  } else {
    return <Globe className="rounded-sm size-8 text-text-primary p-0.5" />;
  }
}
