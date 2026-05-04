import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import {
  ac,
  clientRole,
  staffRole,
  projectManagerRole,
  superAdminRole,
} from "@/lib/permissions";

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles: {
        CLIENT: clientRole,
        STAFF: staffRole,
        PROJECT_MANAGER: projectManagerRole,
        SUPER_ADMIN: superAdminRole,
      },
    }),
  ],
});
