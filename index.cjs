const { app } = require("./src/index.cjs");

app.listen(3000, () => {
  console.log("yo, we be running on http://0.0.0.0:3000");
});
