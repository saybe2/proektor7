export function isOwnerRole(role?: string | null) {
  return role === "OWNER" || role === "DEVELOPER";
}
export function isStaffRole(role?: string | null) {
  return role === "ADMIN" || isOwnerRole(role);
}
