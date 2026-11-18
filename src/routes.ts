
import { Router } from "express";
import {
  get42Student,
  get42StudentProjects
} from "./intra42";

const router = Router();

function validLogin(login: string): boolean {
  return /^[a-zA-Z0-9_-]{1,50}$/.test(login);
}

// Begin routes
router.get("/", (_req, res) => {
  res.json({
    status: "Okay, running",
    application: "42 Horizon"
  });
});

// Test backend
router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    application: "42 Horizon"
  });
});

// Get student profile
router.get("/students/:login", async (req, res) => {
  try {
    const login = String(req.params.login);

    if (!validLogin(login)) {
      res.status(400).json({ error: "Invalid login" });
      return;
    }

    const student = await get42Student(login);

    const mainCursus = student.cursus_users?.find(
      cursus => cursus.cursus_id === 21
    );

    res.json({
      id: student.id,
      login: student.login,
      first_name: student.first_name,
      last_name: student.last_name,
      name: student.displayname,
      image: student.image?.link,
      campus: student.campus?.map(campus => ({
        id: campus.id,
        name: campus.name,
        country: campus.country
      })),
      status: mainCursus?.grade ?? null,
      level: mainCursus?.level ?? null,
      skills: mainCursus?.skills ?? [],
      cursus: student.cursus_users?.map(c => ({
        id: c.cursus_id,
        name: c.cursus?.name,
        grade: c.grade,
        level: c.level,
        begin_at: c.begin_at,
        end_at: c.end_at
      }))
    });

  } catch (error) {
    console.error(error);
    res.status(502).json({
      error: "Failed to retrieve student"
    });
  }
});

// Get all project attempts
router.get("/students/:login/projects", async (req, res) => {
  try {
    const login = String(req.params.login);

    if (!validLogin(login)) {
      res.status(400).json({ error: "Invalid login" });
      return;
    }

    const student = await get42Student(login);
    const projects = await get42StudentProjects(student.id);

    res.json({
      student: student.login,
      total: projects.length,
      projects: projects.map(project => ({
        id: project.id,
        project_id: project.project?.id,
        name: project.project?.name,
        slug: project.project?.slug,
        status: project.status,
        score: project.final_mark,
        validated: project["validated?"],
        created_at: project.created_at,
        marked_at: project.marked_at,
        cursus_ids: project.cursus_ids
      }))
    });

  } catch (error) {
    console.error(error);
    res.status(502).json({
      error: "Failed to retrieve student projects"
    });
  }
});

export default router;
