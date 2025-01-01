import { merge } from "webpack-merge";
import common from "./webpack.common.js";

const devConfig = merge(common, {
  mode: "development",
  devtool: "inline-source-map",
});

export default devConfig;
