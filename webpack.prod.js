import { merge } from "webpack-merge";
import common from "./webpack.common.js";

const prodConfig = merge(common, {
  mode: "production",
});

export default prodConfig;
