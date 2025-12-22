import { fetchService } from "@/apis/services/services";
import Button from "@/components/ui/Button";
import { useQuery } from "@/lib/query-lite";
import { SiGithub } from "@icons-pack/react-simple-icons";
import clsx from "clsx";
import { AppWindow, Server } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useParams } from "react-router";
import { motion } from "motion/react";

function ServiceLayout() {
  const { serviceNumber } = useParams();

  const { data } = useQuery({
    queryKey: `service-${serviceNumber}`,
    queryFunction: () => fetchService(Number(serviceNumber)),
  });

  if (!data || !serviceNumber) {
    return;
  }

  return (
    <div className="w-full min-w-0">
      <header
        className="
        w-full
        border-b-badge border-b-1 pt-10 px-5
        flex flex-col gap-2"
      >
        <div
          className="
          flex flex-row       
          w-full 
          justify-between
          items-center "
        >
          <div className="flex flex-col">
            <div
              className="
          text-sm text-text-secondary 
          flex flex-row gap-1
          items-center "
            >
              {data.type === "server" ? (
                <Server size={16} />
              ) : (
                <AppWindow size={16} />
              )}
              <p className="font-mono">{data.type.toUpperCase()}</p>
            </div>
            <h1 className="text-text-primary text-3xl">{data.name}</h1>
          </div>

          <div className="flex flex-row gap-2">
            <Button
              variation="secondary"
              onClick={() =>
                window.open(`https://github.com/${data.repoId}`, "_blank")
              }
            >
              <SiGithub size={14} className="text-text-primary" />
              <p> Repository </p>
            </Button>

            <Button
              variation="default"
              onClick={() =>
                window.open(
                  data.cloudFrontDomainName.startsWith("https://")
                    ? data.cloudFrontDomainName
                    : "https://" + data.cloudFrontDomainName,
                  "_blank"
                )
              }
            >
              <p>Visit</p>
            </Button>
          </div>
        </div>
        <TopNavBar />
      </header>

      <main className="pt-5 px-5 w-full min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

type Tab = {
  to: string;
  text: string;
};

const tabs: Tab[] = [
  {
    to: "settings",
    text: "Settings",
  },
  {
    to: "deployment",
    text: "Deployment",
  },
];

function TopNavBar() {
  const location = useLocation();

  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (location.pathname.includes("settings")) {
      setSelectedIndex(0);
    } else if (location.pathname.includes("deployment")) {
      setSelectedIndex(1);
    } else {
      setSelectedIndex(-1);
    }
  }, [location]);

  return (
    <nav
      className="w-full flex flex-row justify-center items-center"
      onPointerLeave={() => setHoveredIndex(-1)}
    >
      {tabs.map((val, idx) => {
        return (
          <StyledNavLink
            to={val.to}
            key={idx}
            idx={idx}
            hoveredIdx={hoveredIndex}
            selectedIdx={selectedIndex}
            setHoveredIdx={setHoveredIndex}
            setSelectedIdx={(idx: number) => {
              setSelectedIndex(idx);
            }}
          >
            <p>{val.text}</p>
          </StyledNavLink>
        );
      })}
    </nav>
  );
}

type StyledNavLinkProps = {
  to: string;
  children: ReactNode;
  setHoveredIdx: (idx: number) => void;
  setSelectedIdx: (idx: number) => void;
  idx: number;
  hoveredIdx: number;
  selectedIdx: number;
};

function StyledNavLink({
  to,
  children,
  setHoveredIdx,
  setSelectedIdx,
  idx,
  hoveredIdx,
  selectedIdx,
}: StyledNavLinkProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          "relative px-3 py-4",
          "hover:text-text-primary",
          isActive ? "text-text-primary" : "text-text-secondary"
        )
      }
      onPointerEnter={() => setHoveredIdx(idx)}
      onFocus={() => setHoveredIdx(idx)}
      onClick={() => setSelectedIdx(idx)}
    >
      {hoveredIdx === idx && (
        <motion.div
          className="
        absolute w-full h-8/10 
        top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        rounded-md bg-sidebar-selected"
          layoutId="nav-hovered-block"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      {selectedIdx === idx && (
        <motion.div
          className="
        absolute w-full h-[2px] 
        left-1/2 -translate-x-1/2 bottom-0
        bg-text-primary"
          layoutId="nav-selected-underline"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <div className="relative">{children}</div>
    </NavLink>
  );
}

export default ServiceLayout;
