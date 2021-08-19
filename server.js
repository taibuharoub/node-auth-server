import server from "./app.js";
import connectDB from "./utils/db.js";
connectDB();

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`Server Started at http://localhost:${port}`);
});
