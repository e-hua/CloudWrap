import { assumeRole } from "@/services/assumeRoleService.js";
import { createGithubConnection } from "./create-github-connection.js";

async function main() {
  const credential = await assumeRole();
  const res = await createGithubConnection(credential);
  console.log(res);
}

main();
