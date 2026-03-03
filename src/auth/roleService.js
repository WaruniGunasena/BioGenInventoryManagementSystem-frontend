import { getRole } from "./tokenService";

export const isAdmin = () => getRole() === "ADMIN";

export const isInventoryManager = () =>
  getRole() === "INVENTORY_MANAGER";

export const isSalesRep = () =>
  getRole() === "SALES_REP";

export const isUser = () =>
  getRole() === "USER";
