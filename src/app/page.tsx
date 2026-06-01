import { BezierPlayground } from '@/components/BezierPlayground';
import { PixelGround } from '@/components/PixelGround';

export default function Home() {
  return (
    <PixelGround>
      <main className="min-h-screen p-1 flex flex-col">
        <BezierPlayground />
      </main>
    </PixelGround>
  );
}
