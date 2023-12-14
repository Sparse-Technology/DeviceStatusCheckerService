const path = require("path");

module.exports = {
  mode: "development",
  //index.js file for which dependencies should we add into the jsbundle.js
  entry: "./src/index.js",
  //Where to create the bundle file
  output: {
    filename: "jsbundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    //Rule for css loading, first npm install style-loader and css-loader
    //It gets all the .css related files to include in jsbundle.js
    rules: [
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: require.resolve("jquery"),
        use: {
          loader: "expose-loader",
          options: {
            exposes: ["$", "jQuery"],
          },
        },
      },
    ],
  },
};
