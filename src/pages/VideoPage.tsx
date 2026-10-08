import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { MOCK_COURSE } from "@/data/mockData";
import { useProgress } from "@/context/ProgressContext";
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import AIAssistantPanel from "@/components/ai/AIAssistantPanel";
import VideoWorkChecker from "@/components/course/VideoWorkChecker";

const TRANSCRIPTS: Record<number, string> = {
  1: `Good morning everyone!

Have you ever wondered how a simple ball of yarn can turn into something beautiful and useful? That's the magic of knitting!

Knitting is a creative skill where we use yarn and needles to make different products like sweaters, scarves, caps, bags, and many more things. It is not only fun, but it also helps us develop patience, creativity, and practical skills.

But making a product is only one part. How we present and share it is equally important. We can make our knitted products attractive by keeping them neat, showing their unique designs, and explaining how they were made. We can also display them at exhibitions, share them on social media, or show them to our friends and family.

So, knitting is more than just making things with yarn—it is a way to create, express, and share our ideas with others.`,

  2: `Material Knowledge in knitting means understanding the different materials and tools needed to create knitted products. The main material used is yarn, which is available in different types, colors, thicknesses, and textures. For example, wool yarn is warm and is often used for sweaters and winter clothes, while cotton yarn is lighter and more suitable for items used in warmer weather.

Another important material is knitting needles. Needles come in different sizes and can be made from materials such as metal, wood, or plastic. The size of the needle is usually selected based on the thickness of the yarn and the type of product being made.

Knitting also requires other tools such as scissors, measuring tapes, stitch markers, and yarn needles. Each tool has a specific purpose and helps make the knitting process easier and more accurate.

Understanding these materials helps us choose the right combination of yarn, needles, and tools for a particular project. It also improves the quality, appearance, comfort, and durability of the final knitted product. Therefore, having proper material knowledge is an important part of successful knitting.`,

  3: `First, take the yarn and make a small loop called a slip knot.

Place this loop on one knitting needle.

Now, take the second needle and insert it into the loop.

Wrap the yarn around the needle and pull it through the loop to make a new loop.

Continue this process to create more loops.

Keep the loops even and avoid pulling the yarn too tightly.

As you keep making loops, they connect with each other and form a piece of fabric.

Continue knitting row by row until you reach the size you need.

With this basic process, you can make different items such as scarves, caps, sweaters, and other useful products.

Practice slowly and keep your stitches even for a neat and strong fabric.`,
};

export default function VideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { enrollment, isEnrolled, markCompleted, setLastAccessed } = useProgress();
  const [activeTab, setActiveTab] = useState<"check_work" | "overview" | "transcript">("check_work");
  const [isPlaying, setIsPlaying] = useState(false);

  const videoIndex = MOCK_COURSE.videos.findIndex((v) => v.id === videoId);
  const video = MOCK_COURSE.videos[videoIndex];

  useEffect(() => {
    if (video) setLastAccessed(video.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id]);

  if (!isEnrolled) return <Navigate to="/course" replace />;
  if (!video) return <Navigate to="/course" replace />;

  const isCompleted = Boolean(enrollment?.videoProgress[video.id]?.completed);
  const previousVideo = MOCK_COURSE.videos[videoIndex - 1];
  const nextVideo = MOCK_COURSE.videos[videoIndex + 1];

  const handleMarkCompleted = async () => {
    await markCompleted(video.id);
  };

  const goToVideo = (id: string) => {
    setIsPlaying(false);
    navigate(`/course/video/${id}`);
  };

  const transcript =
    TRANSCRIPTS[video.order] ||
    `Curriculum transcript for Lesson ${video.order}: ${video.description}\n\nStep-by-step video instructions covering stitch mechanics, fiber tension, and durable finish. Follow along with your yarn and needles.`;

  return (
    <div className="space-y-6">
      {/* Breadcrumb Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <Link
          to="/course"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-workshop-600 hover:text-workshop-700 hover:underline"
        >
          <span>←</span> Back to Course Curriculum
        </Link>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-workshop-100 px-3 py-1 text-xs font-bold text-workshop-800">
            Lesson {video.order} of {MOCK_COURSE.totalVideos}
          </span>
          {isCompleted && (
            <span className="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-xs font-bold">
              ✓ Completed
            </span>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left Column: Video Player & Tabs */}
        <div className="space-y-5">
          {/* Enhanced Video Player Interface */}
          <div className="group relative overflow-hidden rounded-2xl bg-slate-900 shadow-md">
            <div
              className="relative flex aspect-video w-full items-center justify-center text-white transition-opacity"
              style={{
                background: `linear-gradient(135deg, ${video.thumbnailColor}dd 0%, #111827 100%)`,
              }}
            >
              {/* Play / Pause Interactive Trigger */}
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                aria-label={isPlaying ? "Pause video" : "Play video"}
                className="group/btn relative flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white shadow-xl ring-4 ring-white/10 transition-all hover:scale-110 hover:bg-white/30 active:scale-95"
              >
                {isPlaying ? (
                  <svg className="h-10 w-10 fill-current" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="h-10 w-10 fill-current translate-x-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Status Overlay */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="rounded-md bg-black/60 px-2.5 py-1 text-xs font-bold tracking-wider uppercase text-white backdrop-blur-xs">
                  Video Lesson {video.order}
                </span>
                <span className="rounded-md bg-workshop-600/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-xs">
                  {video.durationMinutes} min
                </span>
              </div>

              {/* Bottom Video Controls Bar */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative h-1.5 flex-1 rounded-full bg-white/30 cursor-pointer overflow-hidden">
                    <div
                      className="h-full rounded-full bg-workshop-400 transition-all duration-300"
                      style={{ width: isPlaying ? "45%" : "0%" }}
                    />
                  </div>
                  <span className="text-xs font-mono text-white/80">
                    {isPlaying ? "03:15" : "00:00"} / {video.durationMinutes}:00
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-white/90">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPlaying((p) => !p)}
                      className="font-bold hover:text-workshop-200"
                    >
                      {isPlaying ? "Pause ⏸" : "Play ▶"}
                    </button>
                    <span>Speed 1.0x</span>
                    <span>HD 1080p</span>
                  </div>
                  <span className="font-medium text-white/70">
                    Takshashila Craft Curriculum
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Lesson Metadata Header */}
          <div className="rounded-card border border-line bg-white p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold text-ink">{video.title}</h1>
                <p className="mt-1 text-sm text-ink/60">
                  Lesson {video.order} • {video.durationMinutes} minutes duration
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  variant={isCompleted ? "ghost" : "secondary"}
                  onClick={handleMarkCompleted}
                  disabled={isCompleted}
                  className="text-sm"
                >
                  {isCompleted ? "✓ Completed" : "Mark as completed"}
                </Button>
              </div>
            </div>

            {/* Navigation Buttons: Previous / Next */}
            <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
              <Button
                variant="ghost"
                onClick={() => previousVideo && goToVideo(previousVideo.id)}
                disabled={!previousVideo}
                className="text-sm"
              >
                ← Previous Lesson
              </Button>
              <Button
                onClick={() => nextVideo && goToVideo(nextVideo.id)}
                disabled={!nextVideo}
                className="text-sm"
              >
                Next Lesson →
              </Button>
            </div>
          </div>

          {/* Interactive Lesson Tabs: Check My Work / Overview / Transcript */}
          <div className="rounded-2xl border border-workshop-200 bg-white p-5 shadow-2xs space-y-5">
            {/* Tab Buttons */}
            <div className="flex border-b border-line gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveTab("check_work")}
                className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
                  activeTab === "check_work"
                    ? "border-workshop-600 text-workshop-700 bg-workshop-50/60 rounded-t-lg"
                    : "border-transparent text-ink/60 hover:text-ink hover:bg-paper/50 rounded-t-lg"
                }`}
              >
                <span>📸 Check My Work (Photo Upload)</span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5">
                  AI Active
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2.5 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
                  activeTab === "overview"
                    ? "border-workshop-600 text-workshop-700 bg-workshop-50/60 rounded-t-lg"
                    : "border-transparent text-ink/60 hover:text-ink hover:bg-paper/50 rounded-t-lg"
                }`}
              >
                📝 Overview & Practice Objectives
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("transcript")}
                className={`px-4 py-2.5 text-sm font-bold transition-all border-b-2 -mb-[1px] whitespace-nowrap ${
                  activeTab === "transcript"
                    ? "border-workshop-600 text-workshop-700 bg-workshop-50/60 rounded-t-lg"
                    : "border-transparent text-ink/60 hover:text-ink hover:bg-paper/50 rounded-t-lg"
                }`}
              >
                📜 Video Transcript & Rules
              </button>
            </div>

            {/* Tab 1: Check My Work (Photo Upload vs Video Comparison) */}
            {activeTab === "check_work" && (
              <div className="pt-2">
                <VideoWorkChecker
                  initialVideoId={video.id}
                  compact={true}
                  onVerifiedCompleted={() => {
                    handleMarkCompleted();
                  }}
                />
              </div>
            )}

            {/* Tab 2: Overview & Objectives */}
            {activeTab === "overview" && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-ink">Lesson Description</h3>
                  <p className="text-base text-ink/80 leading-relaxed">
                    {video.description}
                  </p>
                </div>

                <div className="rounded-xl border border-workshop-200 bg-workshop-50/60 p-4 space-y-2">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-workshop-800">
                    What You Will Practice in this Video:
                  </h4>
                  <ul className="space-y-1.5 text-sm text-ink/80 list-disc list-inside">
                    {video.order === 3 && (
                      <>
                        <li>Holding yarn comfortably and forming your starting slip knot.</li>
                        <li>Placing the loop on needle 1 with balanced tension (movable, not strangled).</li>
                        <li>Inserting the second needle into the loop without splitting yarn fibers.</li>
                        <li>Wrapping working yarn and drawing through to create linked loops.</li>
                      </>
                    )}
                    {video.order === 2 && (
                      <>
                        <li>Differentiating wool yarn (warm, elastic) from cotton yarn (smooth, breathable).</li>
                        <li>Choosing needle materials (metal for speed vs wood/bamboo for beginners).</li>
                        <li>Selecting proper needle millimeter thickness for your yarn weight.</li>
                        <li>Utilizing scissors, measuring tapes, and stitch markers accurately.</li>
                      </>
                    )}
                    {video.order === 1 && (
                      <>
                        <li>Understanding how knitting converts yarn balls into functional garments.</li>
                        <li>Building patience, rhythm, and hand coordination.</li>
                        <li>Techniques for presenting and showcasing your work for customers and exhibitions.</li>
                      </>
                    )}
                    {video.order > 3 && (
                      <>
                        <li>Building steady row-by-row rhythm and consistent stitch tension.</li>
                        <li>Avoiding tight pulling so your finished fabric remains soft and flexible.</li>
                        <li>Reviewing edge consistency and counting completed rows.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 3: Full Video Transcript */}
            {activeTab === "transcript" && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-workshop-700">
                    Official Spoken Video Transcript:
                  </span>
                  <span className="text-xs text-ink/50">Lesson {video.order}</span>
                </div>
                <div className="rounded-xl bg-paper/60 p-4 border border-line text-sm text-ink/80 leading-relaxed font-sans whitespace-pre-line">
                  {transcript}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Assistant Panel */}
        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <Card className="flex h-full min-h-[440px] flex-col shadow-sm">
            <AIAssistantPanel videoId={video.id} videoTitle={video.title} />
          </Card>
        </div>
      </div>
    </div>
  );
}

