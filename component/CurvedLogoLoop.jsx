"use client";
import { useRef, useEffect, useState, useId } from 'react';

const CurvedLogoLoop = ({
  logos = [],
  speed = 1.5,
  className = "",
  curveAmount = 300,
  direction = 'left',
  interactive = true
}) => {
  const containerRef = useRef(null);
  const pathRef = useRef(null);
  const [offset, setOffset] = useState(0);
  const uid = useId();
  const pathId = `curve-${uid}`;
  // Back to the original downward curve
  const pathD = `M-200,60 Q720,${60 + curveAmount} 1640,60`;

  const dragRef = useRef(false);
  const lastXRef = useRef(0);
  const dirRef = useRef(direction);
  const velRef = useRef(0);
  const animationFrameRef = useRef(null);

  // Logo spacing configuration
  const logoSpacing = 140;

  // Animation loop
  useEffect(() => {
    if (logos.length === 0) return;

    const totalLogoSetWidth = logoSpacing * logos.length;

    const animate = () => {
      if (!dragRef.current) {
        setOffset(prev => {
          const delta = dirRef.current === 'right' ? speed : -speed;
          let newOffset = prev + delta;
          
          // Seamless wrapping - reset when one complete set has passed
          if (newOffset >= totalLogoSetWidth) {
            newOffset = newOffset % totalLogoSetWidth;
          } else if (newOffset <= -totalLogoSetWidth) {
            newOffset = newOffset % totalLogoSetWidth;
          }
          
          return newOffset;
        });
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [logos.length, speed]);

  // Interactive drag handlers
  const onPointerDown = e => {
    if (!interactive) return;
    dragRef.current = true;
    lastXRef.current = e.clientX;
    velRef.current = 0;
    if (e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const onPointerMove = e => {
    if (!interactive || !dragRef.current) return;
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    velRef.current = dx;
    
    setOffset(prev => prev + dx * 2);
  };

  const endDrag = () => {
    if (!interactive) return;
    dragRef.current = false;
    dirRef.current = velRef.current > 0 ? 'right' : 'left';
  };

  const cursorStyle = interactive ? (dragRef.current ? 'grabbing' : 'grab') : 'auto';

  if (logos.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`w-full py-2 ${className}`}
      style={{ cursor: cursorStyle }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
    >
      <svg
        className="select-none w-full overflow-visible block"
        viewBox="0 0 1440 380"
        preserveAspectRatio="xMidYMid slice"
        style={{ maxHeight: '200px' }}
      >
        <defs>
          <path ref={pathRef} id={pathId} d={pathD} fill="none" stroke="transparent" />
        </defs>

        <g>
          {logos.map((logo, idx) => {
            if (!pathRef.current) return null;

            try {
              const pathElement = pathRef.current;
              const totalLength = pathElement.getTotalLength();
              const totalLogoSetWidth = logoSpacing * logos.length;
              
              // Calculate position with seamless wrapping
              const rawPosition = idx * logoSpacing - offset;
              const wrappedPosition = ((rawPosition % totalLogoSetWidth) + totalLogoSetWidth) % totalLogoSetWidth;
              
              // Map the wrapped position to the path length (0 to totalLength)
              const normalizedPosition = (wrappedPosition / totalLogoSetWidth) * totalLength;

              // Get point on path
              const progress = normalizedPosition / totalLength;
              const point = pathElement.getPointAtLength(progress * totalLength);
              
              // Calculate tangent for rotation
              const delta = 0.01;
              const nextProgress = Math.min(progress + delta, 1);
              const nextPoint = pathElement.getPointAtLength(nextProgress * totalLength);
              const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);

              return (
                <g
                  key={`logo-${idx}`}
                  transform={`translate(${point.x}, ${point.y}) rotate(${angle})`}
                  className="opacity-50 hover:opacity-90 transition-opacity duration-300"
                >
                  <svg 
                    x="-40" 
                    y="-40" 
                    width="80" 
                    height="80" 
                    viewBox="0 0 24 24" 
                    className="fill-white"
                  >
                    {logo}
                  </svg>
                </g>
              );
            } catch (e) {
              return null;
            }
          })}
        </g>
      </svg>
    </div>
  );
};

export default CurvedLogoLoop;