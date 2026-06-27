import { ProfileTabs } from "./profile-tabs";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-3xl tracking-wide text-text-primary">Mi perfil</h1>
      <ProfileTabs />
      {children}
    </div>
  );
}
