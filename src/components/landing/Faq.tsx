import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { navigate } from '@/lib/router';
import { useAuth } from '@/lib/auth';

const questions = [
  {
    q: 'Do I need a credit card to start?',
    a: 'No. Creating a free account takes less than a minute and includes 1GB of cloud storage with no card required.',
  },
  {
    q: 'Can I sign in with Google or TikTok?',
    a: 'Social sign-in is part of our roadmap. For now, create an account with your email and password.',
  },
  {
    q: 'What file types can I edit?',
    a: 'LUMORA is designed for MP4, MOV and WEBM video, and PNG, JPG, JPEG and WEBP images. Support is rolling out with the studio.',
  },
  {
    q: 'Will my files stay private?',
    a: 'Yes. Your projects and uploads are visible only to you unless you choose to publish them to the community.',
  },
  {
    q: 'How does the storage limit work?',
    a: 'Free accounts get 1GB. You will see a warning as you approach the limit, and can delete files at any time to free space.',
  },
  {
    q: 'Can I cancel a Pro subscription?',
    a: 'Yes. Subscriptions will be manageable from your account settings, and you can cancel at any time.',
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { user } = useAuth();

  return (
    <section id="faq" className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-text">FAQ</p>
        <h2 className="mt-4 text-3xl font-bold text-ink sm:text-5xl">Questions, answered</h2>
      </div>

      <div className="mt-12 divide-y divide-surface-border overflow-hidden rounded-3xl border border-surface-border bg-surface-panel">
        {questions.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.q}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition hover:bg-surface-subtle"
              >
                <span className="text-base font-semibold text-ink">{item.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-brand-text transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <p className="overflow-hidden px-6 pb-5 text-sm leading-relaxed text-ink-muted">{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>

      {!user && (
        <div className="mt-16 rounded-3xl border border-brand-400/40 bg-gradient-to-br from-brand-500/20 via-surface-panel to-surface-panel p-10 text-center">
          <h3 className="text-2xl font-bold text-ink sm:text-3xl">Your next edit starts here.</h3>
          <p className="mt-3 text-sm text-ink-muted">Create your free LUMORA account and open the studio in minutes.</p>
          <button type="button" onClick={() => navigate('/signup')} className="btn-primary mt-8 !px-8 !py-3.5">
            START CREATING FOR FREE
          </button>
        </div>
      )}
    </section>
  );
}
