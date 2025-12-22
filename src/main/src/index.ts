// When we have "module": "nodenext" enabled
// Node.js requires all relative imports to include the file extension.
// We must explicitly add the compiled file extension (.js) to your relative import paths,
// even though the source file is .ts.
import app from "@/server.js";
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Backend up and running on port ${PORT} + CD is online!`);
});
