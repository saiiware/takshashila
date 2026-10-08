import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CourseEnrollment } from "@/types";
import * as progressService from "@/services/progressService";
import { MOCK_COURSE } from "@/data/mockData";

interface ProgressContextValue {
  enrollment: CourseEnrollment | null;
  isLoading: boolean;
  isEnrolled: boolean;
  completedCount: number;
  progressPercent: number;
  enroll: () => Promise<void>;
  markCompleted: (videoId: string) => Promise<void>;
  setLastAccessed: (videoId: string) => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [enrollment, setEnrollment] = useState<CourseEnrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    progressService.getEnrollment(MOCK_COURSE.id).then((existing) => {
      setEnrollment(existing);
      setIsLoading(false);
    });
  }, []);

  const enroll = useCallback(async () => {
    const result = await progressService.enrollInCourse(MOCK_COURSE.id);
    setEnrollment(result);
  }, []);

  const markCompleted = useCallback(async (videoId: string) => {
    const result = await progressService.markVideoCompleted(MOCK_COURSE.id, videoId);
    setEnrollment(result);
  }, []);

  const setLastAccessed = useCallback(async (videoId: string) => {
    const result = await progressService.setLastAccessedVideo(MOCK_COURSE.id, videoId);
    setEnrollment(result);
  }, []);

  const completedCount = enrollment
    ? Object.values(enrollment.videoProgress).filter((v) => v.completed).length
    : 0;

  const progressPercent = Math.round((completedCount / MOCK_COURSE.totalVideos) * 100);

  const value = useMemo<ProgressContextValue>(
    () => ({
      enrollment,
      isLoading,
      isEnrolled: enrollment !== null,
      completedCount,
      progressPercent,
      enroll,
      markCompleted,
      setLastAccessed,
    }),
    [enrollment, isLoading, completedCount, progressPercent, enroll, markCompleted, setLastAccessed]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress must be used within a ProgressProvider");
  return context;
}
