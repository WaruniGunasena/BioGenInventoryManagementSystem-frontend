import { getRole } from "./tokenService";

// Role checkers
export const isAdmin = () => getRole() === "ADMIN";

export const isInventoryManager = () =>
  getRole() === "INVENTORY_MANAGER";

export const isUser = () =>
  getRole() === "USER";
