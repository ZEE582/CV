export default function Background() {
  return (
    <>
      {/* Animated grid — subtle on white */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(79,70,229,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.05) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          animation: 'gridMove 20s linear infinite',
        }}
      />
      {/* Orb 1 — indigo */}
      <div
        className="fixed w-[500px] h-[500px] rounded-full pointer-events-none opacity-20"
        style={{
          background: '#4f46e5',
          filter: 'blur(100px)',
          top: '-120px',
          left: '-120px',
          animation: 'orbFloat1 8s ease-in-out infinite',
        }}
      />
      {/* Orb 2 — pink */}
      <div
        className="fixed w-[400px] h-[400px] rounded-full pointer-events-none opacity-20"
        style={{
          background: '#ff80b5',
          filter: 'blur(100px)',
          bottom: '-80px',
          right: '-80px',
          animation: 'orbFloat2 10s ease-in-out infinite',
        }}
      />
      {/* Orb 3 — violet */}
      <div
        className="fixed w-[300px] h-[300px] rounded-full pointer-events-none opacity-10"
        style={{
          background: '#9089fc',
          filter: 'blur(80px)',
          top: '40%',
          left: '50%',
          animation: 'orbFloat3 12s ease-in-out infinite',
        }}
      />
    </>
  )
}
