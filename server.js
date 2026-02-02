require("dotenv").config();
const app = require("./src/app");
const { connectDB } = require("./src/config/database");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📱 User dashboard: http://localhost:${PORT}/user`);
      console.log(`👨‍💼 Admin dashboard: http://localhost:${PORT}/admin`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
