import { useState } from "react";
import { Link } from "react-router-dom";
import { useProgress } from "@/context/ProgressContext";
import { DEMO_VIDEO, MOCK_COURSE } from "@/data/mockData";
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
    if (enrollment?.videoProgress[MOCK_COURSE.videos[index].id]?.completed) return "completed" as const;
    if (index === activeVideoIndex) return "current" as const;
    return "upcoming" as const;
  };

  return (
    <div className="space-y-8">
      {/* Course Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-workshop-700 via-workshop-600 to-workshop-500 p-6 md:p-8 text-white shadow-md">
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rounded-full bg-white/20 backdrop-blur-xs px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
              Official Crochet Curriculum
            </span>
            <span className="rounded-full bg-turmeric-400 text-workshop-900 px-3 py-1 text-xs font-extrabold">
              4 Step-by-Step Video Lessons
            </span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
            {MOCK_COURSE.title}
          </h1>

          <p className="text-base md:text-lg text-white/90 leading-relaxed mb-6">
            Master the art of crochet: learn foundation stitches (Chain, Single, Half Double, Double Crochet) and create stunning geometric shapes including Hearts, Pentagons, and Hexagons.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-white/80">
            <span className="flex items-center gap-1.5 font-medium">
              ~30 min total
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              Hands-on shape projects
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              AI Tutor in Marathi & English
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
                {`Part ${currentLearningVideo.order}`} • {currentLearningVideo.durationMinutes} min
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
                  Resume Lesson
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-workshop-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-ink">Ready to start crocheting?</h2>
              <p className="mt-1 text-sm text-ink/70">
                Enroll for free to unlock all 4 video lessons, track your progress, and get instant AI guidance on stitches and shapes.
              </p>
            </div>
            <Button onClick={handleRegister} disabled={isEnrolling} className="shrink-0">
              {isEnrolling ? "Registering…" : "Enroll for Free"}
            </Button>
          </div>
        </Card>
      )}

      {/* Dedicated Section for Demo Video */}
      <section className="space-y-4" aria-label="Course Demo Video">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-turmeric-500 text-white shadow-2xs font-bold text-sm">
              ▶
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-ink">
                Course Demo Video
              </h2>
              <p className="text-xs sm:text-sm text-ink/60">
                Watch the introductory demonstration on panel stitching and running stitch techniques
              </p>
            </div>
          </div>
          <span className="rounded-full bg-turmeric-100 border border-turmeric-300 px-3 py-1 text-xs font-bold text-turmeric-800 shrink-0">
            Preview Video
          </span>
        </div>

        <Card className="border-workshop-200/90 bg-gradient-to-br from-workshop-50/70 via-white to-amber-50/30 p-4 sm:p-5 shadow-xs hover:border-workshop-400 transition-all">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Left: Video Preview */}
            <div className="md:col-span-5 relative aspect-video overflow-hidden rounded-xl bg-black border border-workshop-200 shadow-2xs group">
              <video
                src={DEMO_VIDEO.videoUrl}
                preload="metadata"
                className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Link
                  to={`/course/video/${DEMO_VIDEO.id}`}
                  className="flex h-13 w-13 items-center justify-center rounded-full bg-workshop-600/90 text-white shadow-lg backdrop-blur-xs transition-transform group-hover:scale-110 hover:bg-workshop-600"
                  aria-label="Play Course Demo Video"
                >
                  <svg className="h-6 w-6 translate-x-0.5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </Link>
              </div>
              <div className="absolute bottom-2 left-2 rounded-md bg-black/75 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur-xs">
                ⏱ {DEMO_VIDEO.durationMinutes} min
              </div>
              <div className="absolute top-2 left-2 rounded-md bg-turmeric-500 text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                Demo
              </div>
            </div>

            {/* Right: Info & CTA */}
            <div className="md:col-span-7 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-turmeric-100 text-turmeric-800 border border-turmeric-200 px-2.5 py-0.5 text-xs font-bold">
                  Demo Lecture
                </span>
                <span className="rounded-full bg-paper text-ink/60 border border-line px-2.5 py-0.5 text-xs font-medium">
                  Marathi Audio + Subtitles
                </span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold">
                  All Learners
                </span>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-ink">
                  {DEMO_VIDEO.title}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-ink/70 leading-relaxed">
                  {DEMO_VIDEO.description}
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link to={`/course/video/${DEMO_VIDEO.id}`}>
                  <Button className="shadow-xs text-xs sm:text-sm px-4 py-2 sm:px-5 sm:py-2.5">
                    Watch Demo Video →
                  </Button>
                </Link>
                <span className="text-xs text-ink/50">
                  Interactive timestamps & AI assistant available
                </span>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Curriculum Modules */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-ink">Course Lessons</h2>
          <p className="text-sm text-ink/60 mt-1">
            Follow the 4-part sequential course from foundation stitches to advanced geometric shapes.
          </p>
        </div>

        {/* All Video Lessons */}
        <div className="space-y-2.5">
          {MOCK_COURSE.videos.map((video, idx) => (
            <VideoListItem key={video.id} video={video} status={getStatus(idx)} />
          ))}
        </div>
      </div>
    </div>
  );
}
