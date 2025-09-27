import React from 'react';

const ConfettiPiece: React.FC<{ initialX: number; initialY: number; rotation: number; delay: number; color: string }> = ({ initialX, initialY, rotation, delay, color }) => {
  const style = {
    '--initial-x': `${initialX}vw`,
    '--initial-y': `${initialY}vh`,
    '--rotation': `${rotation}deg`,
    animation: `confetti-fall 3s ${delay}s ease-out forwards`,
    backgroundColor: color,
  } as React.CSSProperties;

  return <div className="absolute w-2 h-4" style={style}></div>;
};

const Confetti: React.FC = () => {
  const colors = ['#06b6d4', '#ec4899', '#f59e0b', '#84cc16', '#a855f7'];
  const pieces = Array.from({ length: 100 }).map((_, i) => {
    return {
      id: i,
      initialX: Math.random() * 100,
      initialY: -10 - Math.random() * 20,
      rotation: Math.random() * 360,
      delay: Math.random() * 1,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  });

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translate3d(var(--initial-x), var(--initial-y), 0) rotate(var(--rotation));
            opacity: 1;
          }
          100% {
            transform: translate3d(calc(var(--initial-x) + ${Math.random() * 20 - 10}vw), 110vh, 0) rotate(calc(var(--rotation) + ${Math.random() * 360}deg));
            opacity: 0;
          }
        }
      `}</style>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-50">
        {pieces.map(p => (
          <ConfettiPiece key={p.id} {...p} />
        ))}
      </div>
    </>
  );
};

export default Confetti;
