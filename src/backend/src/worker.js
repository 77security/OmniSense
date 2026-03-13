async function update() {
  console.log("Starting TI database update...");
  try {
    updateURLhaus = require("./urlhausService").updateURLhaus
    console.log("update completed successfully.");
    process.exit(0); // Success
  } catch (err) {
    console.error("update failed:", err);
    process.exit(1); // Failure (K8s will see this and potentially retry)
  }
}

update();
