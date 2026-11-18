import React, { useRef, useState, useEffect } from 'react';

interface KnobProps {
  label: string;
  minLabel: string;
  maxLabel: string;
  value: number; // 0.0 to 1.0
  onChange: (value: number) => void;
  color?: string; // Hex or tailwind class
}

export const Knob: React.FC<KnobProps> = ({
  label,
  minLabel,
  maxLabel,
  value,
  onChange,
  color = '#22d3ee' // Cyan
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartValue = useRef(0);

  // Convert value [0..1] to rotation angle in degrees (e.g. -135 to 135 deg)
  const minAngle = -135;
  const maxAngle = 135;
  const angle = minAngle + value * (maxAngle - minAngle);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartValue.current = value;
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartY.current = e.touches[0].clientY;
    dragStartValue.current = value;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = dragStartY.current - e.clientY; // Dragging UP increases value
      const speed = 0.005; // Adjust sensitivity
      const newValue = Math.min(1, Math.max(0, dragStartValue.current + deltaY * speed));
      onChange(Number(newValue.toFixed(2)));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const deltaY = dragStartY.current - e.touches[0].clientY;
      const speed = 0.005;
      const newValue = Math.min(1, Math.max(0, dragStartValue.current + deltaY * speed));
      onChange(Number(newValue.toFixed(2)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, onChange]);

  return (
    <div className="knob-container">
      <span className="knob-label">{label}</span>
      
      <div 
        ref={knobRef}
        className={`knob-dial ${isDragging ? 'is-dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{ cursor: 'ns-resize' }}
      >
        {/* Glow behind the knob */}
        <div 
          className="knob-glow" 
          style={{ 
            backgroundColor: color, 
            opacity: 0.05 + value * 0.15,
            transform: `scale(${1 + value * 0.2})` 
          }} 
        />
        
        {/* SVG Face */}
        <svg className="knob-svg" viewBox="0 0 100 100">
          {/* Outer Dial Track */}
          <circle 
            cx="50" 
            cy="50" 
            r="40" 
            fill="none" 
            stroke="rgba(246, 241, 234, 0.05)" 
            strokeWidth="6" 
          />
          
          {/* Active Value Ring Arc */}
          <circle 
            cx="50" 
            cy="50" 
            r="40" 
            fill="none" 
            stroke={color} 
            strokeWidth="6" 
            strokeDasharray={`${value * 251} 251`}
            transform="rotate(135 50 50)" 
            strokeLinecap="round"
          />
          
          {/* Inner Dial Circle */}
          <circle cx="50" cy="50" r="32" fill="#14111d" stroke="rgba(246, 241, 234, 0.12)" strokeWidth="2" />
          
          {/* Indicator Dot (Rotates with value) */}
          <g transform={`rotate(${angle} 50 50)`}>
            <circle cx="50" cy="18" r="4" fill={color} className="knob-indicator" />
            <line x1="50" y1="50" x2="50" y2="18" stroke={color} strokeWidth="2" opacity="0.4" />
          </g>
        </svg>

        {/* Display Center Percentage */}
        <div className="knob-value" style={{ color }}>
          {Math.round(value * 100)}%
        </div>
      </div>

      <div className="knob-limits">
        <span className="knob-limit-min">{minLabel}</span>
        <span className="knob-limit-max">{maxLabel}</span>
      </div>
    </div>
  );
};
