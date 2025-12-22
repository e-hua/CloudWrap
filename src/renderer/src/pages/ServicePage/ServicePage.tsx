import { fetchServices } from "@/apis/services/services";
import ProjectCard from "@/components/ProjectCard";
import Button from "@/components/ui/Button";
import { useQuery } from "@/lib/query-lite";
import { useNavigate } from "react-router";

function ServicePage() {
  const navigate = useNavigate();

  const { data, error, status } = useQuery({
    queryKey: "services",
    queryFunction: fetchServices,
  });

  if (status === "error") {
    return <p className="text-red-400">Error:{error}</p>;
  } else if (status === "idle") {
    return <p className="text-gray-400">Idle</p>;
  } else if (status === "loading") {
    return <p className="text-blue-400">Loading...</p>;
  }

  return (
    <div className="flex flex-col px-[15%] w-full h-full gap-y-2">
      <div className="flex flex-row justify-between mt-1 py-1">
        <h1 className="text-text-primary text-2xl font-bold">Services</h1>
        <Button
          variation="default"
          onClick={() => {
            navigate(`new`);
          }}
        >
          <p>Add New...</p>
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-5">
        {(data || []).map((elem, idx) => {
          return <ProjectCard key={idx} data={elem} />;
        })}
      </div>
    </div>
  );
}

export default ServicePage;
