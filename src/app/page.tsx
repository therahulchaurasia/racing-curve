import { BezierPlayground } from '@/components/BezierPlayground';
import { PixelGround } from '@/components/PixelGround';

export default function Home() {
  return (
    // PixelGround = night-dirt world ground (shows below the horizon); the sky gradient + stars +
    // mountains live in BezierPlayground's top zone above it.
    <PixelGround>
      <main className="relative z-10 min-h-screen flex flex-col">
        <BezierPlayground />
      </main>
    </PixelGround>
  );
}
