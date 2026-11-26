// @ts-check
import { appRoot } from "@prisma/composer";
import aarohSiteService from "./service.mjs";

export default appRoot("aaroh", ({ provision }) => {
  provision(aarohSiteService, { id: "aarohsite" });
});
