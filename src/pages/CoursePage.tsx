import { useState } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "@/context/ProgressContext";
import { MOCK_COURSE } from "@/data/mockData";
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import ProgressBar from "@/components/common/ProgressBar";
import VideoListItem from "@/components/course/VideoListItem";

export default function CoursePage() {
  const { enrollment, isEnrolled, completedCount, progressPercent, enroll } = useProgress();
  const [isEnrolling, setIsEnrolling] = useState(false);

  const handleRegister = async () => {
    setIsEnrolling(true);
    try {
      await enroll();
    } finally {
      setIsEnrolling(false);
    }
  };

  const firstIncompleteIndex = MOCK_COURSE.videos.findIndex(
    (v) => !enrollment?.videoProgress[v.id]?.completed
  );

  const activeVideoIndex = firstIncompleteIndex !== -1 ? firstIncompleteIndex : 0;
  const activeVideo = MOCK_COURSE.videos[activeVideoIndex];
  const targetVideoId = enrollment?.lastAccessedVideoId ?? activeVideo.id;
  const currentLearningVideo = MOCK_COURSE.videos.find((v) => v.id === targetVideoId) ?? activeVideo;

  const getStatus = (index: number) => {
    if (!isEnrolled) return "locked" as const;
    if (enrollment?.videoProgress[MOCK_COURSE.videos[index].id]?.completed) return "completed" as const;
    if (index === activeVideoIndex) return "current" as const;
    if (index < activeVideoIndex || activeVideoIndex === -1) return "upcoming" as const;
    return "locked" as const;
  };

  // Group curriculum into 3 logical modules
  const module1Videos = MOCK_COURSE.videos.slice(0, 3); // Lessons 1-3
  const module2Videos = MOCK_COURSE.videos.slice(3, 6); // Lessons 4-6
  const module3Videos = MOCK_COURSE.videos.slice(6, 10); // Lessons 7-10

  return (
    <div className="space-y-8">
      {/* Course Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-workshop-700 via-workshop-600 to-workshop-500 p-6 md:p-8 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rounded-full bg-white/20 backdrop-blur-xs px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Official Craft Curriculum
            </span>
            <span className="rounded-full bg-turmeric-400 text-workshop-900 px-3 py-1 text-xs font-extrabold">
              10 Video Lessons
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
            {MOCK_COURSE.title}
          </h1>

          <p className="text-base md:text-lg text-white/90 leading-relaxed mb-6">
            Master the timeless art of hand knitting: understand wool vs cotton yarn, select proper metal and wooden needles, craft balanced slip knots, and build beautiful handmade creations.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-white/80">
            <span className="flex items-center gap-1.5 font-medium">
              <span>⏱️</span> ~1 hr 45 min total
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span>🧶</span> Hands-on projects
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span>🤖</span> AI tutor & photo feedback
            </span>
          </div>
        </div>

        {/* Decorative background geometry */}
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute right-16 -bottom-16 h-48 w-48 rounded-full bg-white/5 pointer-events-none" />
      </div>

      {/* Unified Active Learning / Progress Hub */}
      {isEnrolled ? (
        <Card className="border-workshop-200 bg-gradient-to-r from-workshop-50/60 to-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-workshop-700">
                  Your Learning in Progress
                </span>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-ink">
                {currentLearningVideo.title}
              </h2>

              <p className="text-sm text-ink/70">
                Lesson {currentLearningVideo.order} of {MOCK_COURSE.totalVideos} • {currentLearningVideo.durationMinutes} min
              </p>

              <div className="pt-2 max-w-md">
                <ProgressBar percent={progressPercent} label="Overall Course Completion" />
                <p className="mt-1.5 text-xs text-ink/60">
                  {completedCount} of {MOCK_COURSE.totalVideos} videos finished ({progressPercent}%)
                </p>
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link to={`/course/video/${currentLearningVideo.id}`}>
                <Button className="w-full sm:w-auto shadow-md text-base px-6 py-3">
                  <span className="flex items-center gap-2">
                    <span>Resume Lesson</span>
                    <span>▶</span>
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-workshop-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-ink">Ready to start knitting?</h2>
              <p className="mt-1 text-sm text-ink/70">
                Enroll for free to unlock all 10 video lessons, track your stitch count, and get instant AI photo feedback on your slip knot and yarns.
              </p>
            </div>
            <Button onClick={handleRegister} disabled={isEnrolling} className="shrink-0">
              {isEnrolling ? "Registering…" : "Enroll for Free"}
            </Button>
          </div>
        </Card>
      )}

      {/* Curriculum Modules */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">Course Curriculum</h2>
          <p className="text-sm text-ink/60 mt-1">
            Follow the sequential roadmap from basic tool identification to exhibition-ready knitted goods.
          </p>
        </div>

        {/* Module 1 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-workshop-600 text-white font-extrabold text-xs">
              1
            </span>
            <h3 className="text-lg font-bold text-ink">Module 1: Foundations & Essential Materials</h3>
            <span className="text-xs text-ink/50">(Lessons 1 - 3)</span>
          </div>
          <div className="space-y-2">
            {module1Videos.map((video, idx) => (
              <VideoListItem key={video.id} video={video} status={getStatus(idx)} />
            ))}
          </div>
        </div>

        {/* Module 2 */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-workshop-600 text-white font-extrabold text-xs">
              2
            </span>
            <h3 className="text-lg font-bold text-ink">Module 2: Core Technique & Project Execution</h3>
            <span className="text-xs text-ink/50">(Lessons 4 - 6)</span>
          </div>
          <div className="space-y-2">
            {module2Videos.map((video, idx) => (
              <VideoListItem key={video.id} video={video} status={getStatus(3 + idx)} />
            ))}
          </div>
        </div>

        {/* Module 3 */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-workshop-600 text-white font-extrabold text-xs">
              3
            </span>
            <h3 className="text-lg font-bold text-ink">Module 3: Advanced Finishing & Exhibition Showcase</h3>
            <span className="text-xs text-ink/50">(Lessons 7 - 10)</span>
          </div>
          <div className="space-y-2">
            {module3Videos.map((video, idx) => (
              <VideoListItem key={video.id} video={video} status={getStatus(6 + idx)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
