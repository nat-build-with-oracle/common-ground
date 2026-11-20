// The town's shared state, split by concern under ./store/.
export type { ScrollWheelMode } from "@/lib/camera";
export { useOffice, setOffice, botById, residentFigureVisible, type Ball, type CameraPick, type State, type Vec3 } from "./store/store.state";
export { onActivity } from "./store/store.events";
export { followFleet, refreshFleet, setPreview } from "./store/store.fleet";
export { addBall, bangkokHour, loadTheme, setScrollWheelMode, setTheme } from "./store/store.toys";
