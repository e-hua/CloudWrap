import LogView from "./LogView";

type BuildLogViewProps = {
  serviceNumber: string | undefined;
  buildId: string | undefined;
};

function BuildLogView({ buildId }: BuildLogViewProps) {
  if (buildId) {
    return (
      <div className="w-full bg-[#ffffff] dark:bg-[#1e1e1e]  border-y border-sidebar-border">
        <LogView 
          key={buildId} 
          enabled={true} 
          starter={() => window.api.deploys.streamBuild(buildId)}
          listener={(callback) => window.api.deploys.onBuildLog(buildId, callback)}
          timeDisabled
        />
      </div>
    );
  } else {
    return <LogView enabled={false} />;
  }
}

export default BuildLogView;
