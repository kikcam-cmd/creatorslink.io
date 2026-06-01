import { requireUser } from "@/lib/auth";
import { updateProfile } from "@/lib/actions/profile";
import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, handle, niche, email_reminders")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-1">Settings</p>
      <h1 className="font-display text-3xl md:text-4xl leading-tight mb-8">
        Settings
      </h1>

      {error ? <Notice>{error}</Notice> : null}
      {saved ? <Notice variant="success">Profile saved.</Notice> : null}

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="font-display text-xl">Your profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateProfile} className="space-y-4">
            <div>
              <Label htmlFor="display_name" className="mb-1.5">
                Name
              </Label>
              <Input
                id="display_name"
                name="display_name"
                defaultValue={profile?.display_name ?? ""}
              />
            </div>
            <div>
              <Label htmlFor="handle" className="mb-1.5">
                Handle
              </Label>
              <Input
                id="handle"
                name="handle"
                defaultValue={profile?.handle ?? ""}
                placeholder="@yourhandle"
              />
            </div>
            <div>
              <Label htmlFor="niche" className="mb-1.5">
                Niche
              </Label>
              <Input
                id="niche"
                name="niche"
                defaultValue={profile?.niche ?? ""}
                placeholder="e.g. skincare, fitness, gaming"
              />
            </div>
            <div>
              <Label className="mb-1.5">Email</Label>
              <Input defaultValue={user.email ?? ""} disabled />
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-[var(--cl-line)] p-3">
              <input
                id="email_reminders"
                name="email_reminders"
                type="checkbox"
                defaultChecked={profile?.email_reminders ?? true}
                className="mt-0.5 h-4 w-4 accent-[var(--cl-accent)]"
              />
              <div>
                <Label htmlFor="email_reminders" className="font-medium">
                  Email me daily reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  A daily digest of deliverables and payments that are overdue or
                  due in the next 7 days. Sent only when you have something due.
                </p>
              </div>
            </div>
            <Button type="submit">Save profile</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
