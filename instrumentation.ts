import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (_error, _request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { db } = await import("./lib/db");
  // Route template only: no URL parameters, personal data, secrets or raw errors.
  await db.auditLog.create({ data: {
    action: "REQUEST_ERROR", target: context.routePath.slice(0, 200), status: 500,
  } }).catch(() => console.error("[audit] Could not record technical error"));
};
