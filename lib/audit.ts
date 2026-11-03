import { db } from "./db";
import { getCurrentUser } from "./auth";

/** Never store request bodies, tokens, error messages or stack traces. */
export function withAudit(handler: (req: import("next/server").NextRequest) => Promise<Response>) {
  return async (req: import("next/server").NextRequest) => {
    const user = await getCurrentUser();
    let status = 500;
    try {
      const response = await handler(req);
      status = response.status;
      return response;
    } finally {
      if (user) await db.auditLog.create({ data: {
        actorId: user.id, action: req.method,
        target: req.nextUrl.pathname, status,
      } }).catch(() => console.error("[audit] Could not record action"));
    }
  };
}
