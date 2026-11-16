import { lessons } from "./lessons.js";
import { compileAttempt, scenarioSetup, tokenRules } from "./flight-code.js";
import { startFlightLab } from "./flight-ui.js";

startFlightLab({
  lessons, compileAttempt, scenarioSetup, tokenRules,
  storageKey: "pythonbook-list-flight-v1",
  filename: "uav_list_manager.py",
});
