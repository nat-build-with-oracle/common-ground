// Town layout as plain data, one module per district family in ./world/.
export type * from "./world/world.types.ts";
export { buildWorld, humanSpawn } from "./world/world.build.ts";
export { houseStyle } from "./world/world.homes.ts";
