import type { CourseEnrollment } from "@/types";

const STORAGE_KEY = "skillsetu.enrollment";
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function readEnrollment(): CourseEnrollment | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as CourseEnrollment) : null;
}

function writeEnrollment(enrollment: CourseEnrollment): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(enrollment));
}

/** Mirrors the future GET on the enrollment for the signed-in user. */
export async function getEnrollment(courseId: string): Promise<CourseEnrollment | null> {
  await delay(150);
  const existing = readEnrollment();
  if (!existing) return null;
  if (existing.courseId === courseId) return existing;
  if (existing.courseId === "course-basic-tailoring") {
    const migrated: CourseEnrollment = {
      ...existing,
      courseId,
    };
    writeEnrollment(migrated);
    return migrated;
  }
  return null;
}

/** Mirrors the future POST /courses/{id}/enroll. */
export async function enrollInCourse(courseId: string): Promise<CourseEnrollment> {
  await delay(300);
  const existing = readEnrollment();
  if (existing && existing.courseId === courseId) return existing;

  const enrollment: CourseEnrollment = {
    courseId,
    enrolledOn: new Date().toISOString(),
    videoProgress: {},
    lastAccessedVideoId: null,
  };
  writeEnrollment(enrollment);
  return enrollment;
}

/** Mirrors the future POST /progress. */
export async function markVideoCompleted(
  courseId: string,
  videoId: string
): Promise<CourseEnrollment> {
  await delay(150);
  const enrollment = readEnrollment() ?? (await enrollInCourse(courseId));

  const updated: CourseEnrollment = {
    ...enrollment,
    lastAccessedVideoId: videoId,
    videoProgress: {
      ...enrollment.videoProgress,
      [videoId]: {
        videoId,
        completed: true,
        lastPositionSeconds: 0,
      },
    },
  };
  writeEnrollment(updated);
  return updated;
}

/** Records which video a learner is currently on without marking it done. */
export async function setLastAccessedVideo(
  courseId: string,
  videoId: string
): Promise<CourseEnrollment> {
  await delay(100);
  const enrollment = readEnrollment() ?? (await enrollInCourse(courseId));
  const updated: CourseEnrollment = { ...enrollment, lastAccessedVideoId: videoId };
  writeEnrollment(updated);
  return updated;
}
