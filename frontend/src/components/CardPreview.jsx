import { useRef, useEffect, useState } from 'react';
import { sanitizeHtmlForDisplay } from '@/lib/sanitize';

export function CardPreview({ html }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const width = el.clientWidth;
      if (width > 0) {
        setScale(width / 600);
      }
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="global-card-scaled">
      <div
        className="global-card-content"
        style={{ transform: `scale(${scale})` }}
          dangerouslySetInnerHTML={{ __html: sanitizeHtmlForDisplay(html) || '<p>Empty</p>' }}
      />
    </div>
  );
}
