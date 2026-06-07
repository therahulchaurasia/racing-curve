import { cookies } from 'next/headers';
import { BezierPlayground } from '@/components/BezierPlayground';
import { PixelGround } from '@/components/PixelGround';
import { parseSettings, parseIntroSeen, SETTINGS_COOKIE, INTRO_COOKIE } from '@/lib/settings';

export default async function Home() {
  // read persisted prefs server-side so the first paint already reflects them (no graph flash)
  const store = await cookies();
  const settings = parseSettings(store.get(SETTINGS_COOKIE)?.value);
  const introSeen = parseIntroSeen(store.get(INTRO_COOKIE)?.value);
  return (
    // PixelGround = night-dirt world ground (shows below the horizon); the sky gradient + stars +
    // mountains live in BezierPlayground's top zone above it.
    <PixelGround>
      <main className="relative z-10 min-h-screen flex flex-col">
        <BezierPlayground initialSettings={settings} introSeen={introSeen} />
      </main>
    </PixelGround>
  );
}
