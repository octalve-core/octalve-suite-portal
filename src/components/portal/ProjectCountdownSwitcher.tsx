"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { useApp } from "./AppContext";
import { Badge, statusClass, statusLabel } from "./UI";
import { ProjectDateCountdown, formatProjectDate } from "./ProjectDateCountdown";

export function ProjectCountdownSwitcher() {
  const { currentUser, selectedProject, clientProjects, state } = useApp();

  const projects = useMemo(() => {
    return currentUser?.role === "CLIENT" ? clientProjects : state.projects;
  }, [clientProjects, currentUser?.role, state.projects]);

  const [projectId, setProjectId] = useState(selectedProject?.id ?? projects[0]?.id ?? "");

  useEffect(() => {
    if (selectedProject?.id) {
      setProjectId(selectedProject.id);
    }
  }, [selectedProject?.id]);

  const project = projects.find((item) => item.id === projectId) ?? projects[0];

  return (
    <div className="settings-countdown-premium">
      <div className="settings-countdown-selector">
        <label>
          <span>Project</span>
          <select
            className="input"
            value={project?.id ?? ""}
            onChange={(event) => setProjectId(event.target.value)}
          >
            {projects.length ? (
              projects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))
            ) : (
              <option value="">No project available</option>
            )}
          </select>
        </label>

        <div className="date-countdown-card">
          <span>Target Date</span>
          <strong>{formatProjectDate(project?.targetDate)}</strong>
        </div>

        <div className="date-countdown-card">
          <span>Status</span>
          {project ? (
            <Badge className={statusClass(project.status)}>
              {statusLabel(project.status)}
            </Badge>
          ) : (
            <strong>Not available</strong>
          )}
        </div>
      </div>

      <ProjectDateCountdown targetDate={project?.targetDate} />
    </div>
  );
}
