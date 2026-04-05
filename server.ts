import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple In-Memory Storage
  let students = [];
  let settings = { minMarks: 40, minAttendance: 75, minAssignment: 50 };

  // API Routes
  app.post("/api/login", (req, res) => {
    const { role, name, password, rollNumber } = req.body;
    if (role === "teacher") {
      if (name.toLowerCase() === "admin" && password === "admin123") {
        return res.json({ success: true, user: { name: "Admin", role: "teacher" } });
      }
    } else {
      const student = students.find(s => s.name.toLowerCase() === name.toLowerCase() && s.rollNumber === rollNumber && s.password === password);
      if (student) return res.json({ success: true, user: { ...student, role: "student" } });
    }
    res.status(401).json({ success: false, message: "Invalid credentials" });
  });

  app.post("/api/register", (req, res) => {
    const { name, rollNumber, department, password } = req.body;
    if (students.find(s => s.rollNumber === rollNumber)) return res.status(400).json({ success: false, message: "Roll number exists" });
    const newStudent = { name, rollNumber, department, password, records: [] };
    students.push(newStudent);
    res.json({ success: true, user: { ...newStudent, role: "student" } });
  });

  app.get("/api/data", (req, res) => res.json({ students, settings }));

  app.post("/api/add-student", (req, res) => {
    const { name, rollNumber } = req.body;
    students.push({ name, rollNumber, department: "General", password: "123", records: [] });
    res.json({ success: true });
  });

  app.post("/api/add-marks", (req, res) => {
    const { rollNumber, record } = req.body;
    const student = students.find(s => s.rollNumber === rollNumber);
    if (student) {
      student.records.push(record);
      res.json({ success: true });
    } else res.status(404).json({ success: false });
  });

  app.post("/api/settings", (req, res) => {
    settings = req.body;
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
