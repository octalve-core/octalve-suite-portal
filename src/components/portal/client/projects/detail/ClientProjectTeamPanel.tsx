import { BriefcaseBusiness, UserRound, UsersRound } from "lucide-react";
import type { Project, User } from "@/lib/types";
import {
  getAssignedUsers,
  getManager,
  roleLabel,
  userInitial,
} from "./client-project-detail-utils";

function TeamMemberRow({
  name,
  email,
  label,
}: {
  name: string;
  email?: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-sm font-black text-slate-700 ring-1 ring-slate-200">
        {userInitial(name)}
      </span>

      <div className="min-w-0">
        <strong className="block truncate text-sm text-slate-950">
          {name}
        </strong>
        <span className="mt-1 block truncate text-xs font-semibold text-slate-500">
          {label}{email ? ` - ${email}` : ""}
        </span>
      </div>
    </div>
  );
}

export function ClientProjectTeamPanel({
  project,
  users,
  currentUser,
}: {
  project: Project;
  users: User[];
  currentUser?: User;
}) {
  const manager = getManager(project, users);
  const assignedUsers = getAssignedUsers(project, users);

  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_6px_16px_rgba(15,23,42,0.02)]">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-[#0064E0] ring-1 ring-blue-100">
          <UsersRound size={20} />
        </span>

        <div>
          <h2 className="text-xl font-semibold tracking-[-0.04em] text-slate-950">
            Project Team
          </h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            Client, project manager and visible assigned delivery members.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <TeamMemberRow
          name={currentUser?.name || project.businessName}
          email={project.clientEmail}
          label="Client"
        />

        <TeamMemberRow
          name={manager?.name || "Not assigned"}
          email={manager?.email}
          label="Project Manager"
        />

        {assignedUsers.map((user) => (
          <TeamMemberRow
            key={user.id}
            name={user.name}
            email={user.email}
            label={roleLabel(user.role)}
          />
        ))}

        {!assignedUsers.length ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <BriefcaseBusiness size={20} className="text-slate-400" />
            <strong className="mt-3 block text-sm text-slate-950">
              No visible delivery staff yet
            </strong>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Assigned team members will appear when Octalve connects staff to phases.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
