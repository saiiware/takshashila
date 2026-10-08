import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/context/ProgressContext";
import { MOCK_COURSE } from "@/data/mockData";
import Card from "@/components/common/Card";
import ProgressBar from "@/components/common/ProgressBar";
import LanguageSelect from "@/components/common/LanguageSelect";
import Button from "@/components/common/Button";

export default function ProfilePage() {
  const { user, updatePreferredLanguage, logout } = useAuth();
  const { isEnrolled, completedCount, progressPercent } = useProgress();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-extrabold text-ink">Profile</h1>

      <Card>
        <h2 className="mb-4 text-xl font-bold text-ink">Your details</h2>
        <dl className="space-y-3 text-lg">
          <div className="flex items-center justify-between">
            <dt className="text-ink/60">Name</dt>
            <dd className="font-medium text-ink">{user.name}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-ink/60">Email / mobile</dt>
            <dd className="font-medium text-ink">{user.contact}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 className="mb-4 text-xl font-bold text-ink">Language</h2>
        <LanguageSelect value={user.preferredLanguage} onChange={updatePreferredLanguage} />
      </Card>

      <Card>
        <h2 className="mb-4 text-xl font-bold text-ink">Course progress</h2>
        {isEnrolled ? (
          <>
            <p className="mb-2 text-lg text-ink">{MOCK_COURSE.title}</p>
            <ProgressBar percent={progressPercent} />
            <p className="mt-3 text-base text-ink/60">
              Videos completed: {completedCount} / {MOCK_COURSE.totalVideos}
            </p>
          </>
        ) : (
          <p className="text-base text-ink/60">You have not registered for a course yet.</p>
        )}
      </Card>

      <Button variant="ghost" onClick={logout}>
        Log out
      </Button>
    </div>
  );
}
