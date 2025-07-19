import { allRules } from "@arnaud-barre/tsl-config";
import { defineConfig, core } from "tsl";

export default defineConfig({
  rules: [...allRules, core.strictBooleanExpressions("off")],
});
