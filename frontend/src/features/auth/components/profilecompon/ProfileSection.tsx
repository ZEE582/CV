import { useId, type ReactNode } from 'react';
export default function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  const id = useId(); return <section className="profile-section" aria-labelledby={id}><h2 id={id}>{title}</h2>{children}</section>;
}
