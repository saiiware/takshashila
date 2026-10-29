import { MOCK_COURSE } from "@/data/mockData";
import type { Course } from "@/types";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Mirrors the future GET /courses/{id}. Only one course exists in the MVP. */
export async function getCourse(courseId: string): Promise<Course | null> {
  await delay(200);
  return courseId === MOCK_COURSE.id ? MOCK_COURSE : null;
}

/** Mirrors the future GET /courses. */
export async function listCourses(): Promise<Course[]> {
  await delay(200);
  return [MOCK_COURSE];
}
