import React from 'react';

export type EntityType = 'sprinter' | 'walker' | 'cyclist' | 'car' | 'bus';

interface RealisticEntityProps {
  type?: EntityType;
  avatarText?: string;
  name?: string;
  color: string;
  speed_mps: number;
  elapsedTime_s: number;
  isRunning: boolean;
  finished: boolean;
  athleteNumber?: number | string;
}

/**
 * Detect entity type based on avatarText, name, or explicit type
 */
export function detectEntityType(avatarText?: string, name?: string, explicitType?: EntityType): EntityType {
  if (explicitType) return explicitType;
  const combined = `${avatarText || ''} ${name || ''}`.toLowerCase();
  
  if (combined.includes('buýt') || combined.includes('bus') || combined.includes('🚌')) {
    return 'bus';
  }
  if (combined.includes('ô tô') || combined.includes('xe hơi') || combined.includes('car') || combined.includes('🚗') || combined.includes('🚘')) {
    return 'car';
  }
  if (combined.includes('đạp') || combined.includes('bike') || combined.includes('cycle') || combined.includes('bicycle') || combined.includes('🚲')) {
    return 'cyclist';
  }
  if (combined.includes('bộ') || combined.includes('walk') || combined.includes('🚶')) {
    return 'walker';
  }
  return 'sprinter';
}

/**
 * High-fidelity animated human sprinter model with realistic joints and kinematics
 */
export const RealisticRunner: React.FC<{
  color: string;
  speed_mps: number;
  elapsedTime_s: number;
  isRunning: boolean;
  finished: boolean;
  athleteNumber?: number | string;
  isWalker?: boolean;
}> = ({ color, speed_mps, elapsedTime_s, isRunning, finished, athleteNumber, isWalker = false }) => {
  // Stride frequency calculation based on velocity
  const effectiveSpeed = Math.max(0.5, speed_mps);
  const baseCadence = isWalker 
    ? 1.5 + effectiveSpeed * 0.4
    : 2.2 + effectiveSpeed * 0.35; // cycles per second
  
  const phase = (elapsedTime_s * baseCadence * 2 * Math.PI) % (2 * Math.PI);
  
  // Dynamic kinematics calculations
  const isAtStart = elapsedTime_s <= 0.05 && !isRunning && !finished;
  
  // Calculate vertical bounce (running oscillation)
  const verticalBounce = (isRunning && !isAtStart) 
    ? Math.abs(Math.sin(phase)) * (isWalker ? 1.5 : 3.5) 
    : 0;
  
  // Forward lean: sprinters lean forward 12-18 degrees
  const leanAngle = isAtStart ? 28 : (isWalker ? 6 : Math.min(20, 10 + effectiveSpeed * 1.2));
  
  // Leg angles in radians
  // Thigh motion: sine wave back and forth
  let thighRight = Math.sin(phase) * (isWalker ? 0.45 : 0.85);
  let thighLeft = Math.sin(phase + Math.PI) * (isWalker ? 0.45 : 0.85);
  
  // Knee motion: higher bend during forward swing
  let kneeRight = (Math.cos(phase) > 0) 
    ? (isWalker ? 0.3 : 1.2) * Math.cos(phase) 
    : 0.15;
  let kneeLeft = (Math.cos(phase + Math.PI) > 0) 
    ? (isWalker ? 0.3 : 1.2) * Math.cos(phase + Math.PI) 
    : 0.15;
    
  // Arm swing in direct opposition to legs
  let armRight = -thighRight * (isWalker ? 0.7 : 1.05);
  let armLeft = -thighLeft * (isWalker ? 0.7 : 1.05);
  
  if (isAtStart) {
    // Crouch ready sprint starting position
    thighRight = 0.7;
    thighLeft = -0.5;
    kneeRight = 1.1;
    kneeLeft = 0.8;
    armRight = -0.6;
    armLeft = 0.7;
  } else if (finished) {
    // Victory crossing line stance: upright with arms celebratory
    thighRight = 0.2;
    thighLeft = -0.2;
    kneeRight = 0.2;
    kneeLeft = 0.2;
    armRight = -1.2;
    armLeft = -1.3;
  }

  // Anatomy Anchor Points (SVG viewBox: 0 0 70 70)
  const hipX = 32;
  const hipY = 36 - verticalBounce;
  
  // Torso vector
  const torsoLength = 16;
  const leanRad = (leanAngle * Math.PI) / 180;
  const shoulderX = hipX + Math.sin(leanRad) * torsoLength;
  const shoulderY = hipY - Math.cos(leanRad) * torsoLength;
  
  // Head
  const headRadius = 5.5;
  const headX = shoulderX + Math.sin(leanRad) * 6;
  const headY = shoulderY - Math.cos(leanRad) * 6;
  
  // Segment lengths
  const thighLen = 13;
  const shinLen = 13;
  const armUpperLen = 9;
  const armForeLen = 8;
  
  // Left Leg (Far / back layer - darker for realistic 3D depth)
  const lKneeX = hipX + Math.sin(thighLeft) * thighLen;
  const lKneeY = hipY + Math.cos(thighLeft) * thighLen;
  const lAnkleX = lKneeX + Math.sin(thighLeft - kneeLeft) * shinLen;
  const lAnkleY = lKneeY + Math.cos(thighLeft - kneeLeft) * shinLen;
  
  // Right Leg (Near / front layer)
  const rKneeX = hipX + Math.sin(thighRight) * thighLen;
  const rKneeY = hipY + Math.cos(thighRight) * thighLen;
  const rAnkleX = rKneeX + Math.sin(thighRight - kneeRight) * shinLen;
  const rAnkleY = rKneeY + Math.cos(thighRight - kneeRight) * shinLen;

  // Left Arm (Far / back layer)
  const lElbowX = shoulderX + Math.sin(armLeft) * armUpperLen;
  const lElbowY = shoulderY + Math.cos(armLeft) * armUpperLen;
  const lHandX = lElbowX + Math.sin(armLeft + 1.2) * armForeLen;
  const lHandY = lElbowY + Math.cos(armLeft + 1.2) * armForeLen;

  // Right Arm (Near / front layer)
  const rElbowX = shoulderX + Math.sin(armRight) * armUpperLen;
  const rElbowY = shoulderY + Math.cos(armRight) * armUpperLen;
  const rHandX = rElbowX + Math.sin(armRight + 1.2) * armForeLen;
  const rHandY = rElbowY + Math.cos(armRight + 1.2) * armForeLen;

  // Skin tone & athletic gear
  const skinColor = '#e0a97a';
  const darkSkin = '#b88358';
  const shortsColor = '#1e293b';

  return (
    <div className="relative flex flex-col items-center">
      <svg 
        viewBox="0 0 70 70" 
        className="w-13 h-13 sm:w-16 sm:h-16 drop-shadow-md overflow-visible select-none"
      >
        {/* Dynamic Ground Shadow */}
        <ellipse
          cx={hipX + 2}
          cy={64}
          rx={isAtStart ? 14 : 11 - verticalBounce * 0.8}
          ry={3.5}
          fill="rgba(0, 0, 0, 0.45)"
        />

        {/* Speed dust puffs when sprinting */}
        {isRunning && speed_mps > 4 && (
          <g opacity={0.65}>
            <circle cx={hipX - 16} cy={62} r={2} fill="#94a3b8" />
            <circle cx={hipX - 22} cy={60} r={3} fill="#cbd5e1" opacity={0.5} />
            <circle cx={hipX - 12} cy={63} r={1.5} fill="#94a3b8" />
          </g>
        )}

        {/* 1. FAR ARM (Left Arm - Behind Body) */}
        <g strokeLinecap="round" strokeLinejoin="round">
          <line
            x1={shoulderX}
            y1={shoulderY}
            x2={lElbowX}
            y2={lElbowY}
            stroke={darkSkin}
            strokeWidth={3.5}
          />
          <line
            x1={lElbowX}
            y1={lElbowY}
            x2={lHandX}
            y2={lHandY}
            stroke={darkSkin}
            strokeWidth={3}
          />
          <circle cx={lHandX} cy={lHandY} r={2} fill={darkSkin} />
        </g>

        {/* 2. FAR LEG (Left Leg - Behind Body) */}
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Thigh */}
          <line
            x1={hipX}
            y1={hipY}
            x2={lKneeX}
            y2={lKneeY}
            stroke={darkSkin}
            strokeWidth={4.5}
          />
          {/* Shin */}
          <line
            x1={lKneeX}
            y1={lKneeY}
            x2={lAnkleX}
            y2={lAnkleY}
            stroke={darkSkin}
            strokeWidth={3.8}
          />
          {/* Athletic Shoe (Far) */}
          <path
            d={`M ${lAnkleX - 2} ${lAnkleY} L ${lAnkleX + 6} ${lAnkleY + 1} L ${lAnkleX + 7} ${lAnkleY + 3.5} L ${lAnkleX - 3} ${lAnkleY + 3.5} Z`}
            fill="#334155"
          />
          <line
            x1={lAnkleX - 3}
            y1={lAnkleY + 3.5}
            x2={lAnkleX + 7}
            y2={lAnkleY + 3.5}
            stroke="#f8fafc"
            strokeWidth={1}
          />
        </g>

        {/* 3. TORSO, ATHLETIC SINGLET & NUMBER */}
        <g>
          {/* Athletic Singlet / Shirt */}
          <line
            x1={hipX}
            y1={hipY}
            x2={shoulderX}
            y2={shoulderY}
            stroke={color}
            strokeWidth={8}
            strokeLinecap="round"
          />
          {/* Athletic Running Shorts */}
          <line
            x1={hipX - 1}
            y1={hipY - 1}
            x2={hipX + 1}
            y2={hipY + 5}
            stroke={shortsColor}
            strokeWidth={8.5}
            strokeLinecap="round"
          />
          {/* Runner Bib / Identification Badge on chest */}
          <rect
            x={shoulderX - 4}
            y={shoulderY + 3}
            width={7}
            height={6}
            rx={1}
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth={0.6}
            transform={`rotate(${leanAngle}, ${shoulderX}, ${shoulderY + 6})`}
          />
          {athleteNumber !== undefined && (
            <text
              x={shoulderX}
              y={shoulderY + 7.5}
              textAnchor="middle"
              fontSize={4.5}
              fontWeight="bold"
              fill="#0f172a"
              fontFamily="sans-serif"
              transform={`rotate(${leanAngle}, ${shoulderX}, ${shoulderY + 6})`}
            >
              {athleteNumber}
            </text>
          )}
        </g>

        {/* 4. NEAR LEG (Right Leg - Front) */}
        <g strokeLinecap="round" strokeLinejoin="round">
          {/* Thigh */}
          <line
            x1={hipX}
            y1={hipY}
            x2={rKneeX}
            y2={rKneeY}
            stroke={skinColor}
            strokeWidth={4.8}
          />
          {/* Knee joint muscle contour */}
          <circle cx={rKneeX} cy={rKneeY} r={2.5} fill={skinColor} />
          {/* Shin */}
          <line
            x1={rKneeX}
            y1={rKneeY}
            x2={rAnkleX}
            y2={rAnkleY}
            stroke={skinColor}
            strokeWidth={4}
          />
          {/* Running Shoe (Near - Detailed with sole and stripe) */}
          <path
            d={`M ${rAnkleX - 2} ${rAnkleY} L ${rAnkleX + 7} ${rAnkleY + 1} L ${rAnkleX + 8} ${rAnkleY + 4} L ${rAnkleX - 3} ${rAnkleY + 4} Z`}
            fill="#e11d48"
          />
          {/* White shoe sole */}
          <line
            x1={rAnkleX - 3}
            y1={rAnkleY + 4}
            x2={rAnkleX + 8}
            y2={rAnkleY + 4}
            stroke="#ffffff"
            strokeWidth={1.3}
          />
        </g>

        {/* 5. HEAD & FACIAL PROFILE */}
        <g>
          {/* Neck */}
          <line
            x1={shoulderX}
            y1={shoulderY}
            x2={headX}
            y2={headY + 2}
            stroke={skinColor}
            strokeWidth={4}
          />
          {/* Head */}
          <circle cx={headX} cy={headY} r={headRadius} fill={skinColor} />
          {/* Athletic Hair / Cap profile */}
          <path
            d={`M ${headX - headRadius + 0.5} ${headY} A ${headRadius} ${headRadius} 0 0 1 ${headX + headRadius - 0.5} ${headY - 2} L ${headX + headRadius - 2} ${headY - 4} A ${headRadius} ${headRadius} 0 0 0 ${headX - headRadius + 1} ${headY - 2} Z`}
            fill="#1e293b"
          />
          {/* Sprinter Headband */}
          <line
            x1={headX - headRadius + 0.5}
            y1={headY - 1}
            x2={headX + headRadius - 0.5}
            y2={headY - 1}
            stroke={color}
            strokeWidth={2}
          />
          {/* Eye looking forward to the finish line */}
          <circle cx={headX + 2.5} cy={headY} r={0.8} fill="#0f172a" />
          {/* Forward nose profile */}
          <polygon
            points={`${headX + 4.5},${headY + 0.5} ${headX + 6},${headY + 1.5} ${headX + 4.5},${headY + 2}`}
            fill={skinColor}
          />
        </g>

        {/* 6. NEAR ARM (Right Arm - Front Layer) */}
        <g strokeLinecap="round" strokeLinejoin="round">
          <line
            x1={shoulderX}
            y1={shoulderY}
            x2={rElbowX}
            y2={rElbowY}
            stroke={skinColor}
            strokeWidth={3.8}
          />
          <circle cx={rElbowX} cy={rElbowY} r={2} fill={skinColor} />
          <line
            x1={rElbowX}
            y1={rElbowY}
            x2={rHandX}
            y2={rHandY}
            stroke={skinColor}
            strokeWidth={3.4}
          />
          <circle cx={rHandX} cy={rHandY} r={2.2} fill={skinColor} />
        </g>
      </svg>
    </div>
  );
};

/**
 * Realistic Bicycle & Cyclist with spinning wheels and pumping legs
 */
export const RealisticCyclist: React.FC<{
  color: string;
  speed_mps: number;
  elapsedTime_s: number;
  isRunning: boolean;
}> = ({ color, speed_mps, elapsedTime_s, isRunning }) => {
  const wheelRotation = isRunning ? (elapsedTime_s * speed_mps * 36) % 360 : 0;
  const pedalPhase = isRunning ? (elapsedTime_s * speed_mps * 2) % (2 * Math.PI) : 0;

  const rearWheelX = 18;
  const frontWheelX = 52;
  const wheelY = 48;
  const wheelR = 14;

  const bbX = 33; // bottom bracket
  const bbY = 48;

  const saddleX = 26;
  const saddleY = 32;

  const handleX = 47;
  const handleY = 28;

  // Cyclist rider anatomy
  const hipX = saddleX + 1;
  const hipY = saddleY - 2;

  const pedalR = 5;
  const pedalX = bbX + Math.cos(pedalPhase) * pedalR;
  const pedalY = bbY + Math.sin(pedalPhase) * pedalR;

  // Knee coordinates (trig solve)
  const kneeX = hipX + 7 + Math.cos(pedalPhase) * 4;
  const kneeY = hipY + 11 + Math.sin(pedalPhase) * 3;

  const shoulderX = 39;
  const shoulderY = 22;

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 70 70" className="w-14 h-14 sm:w-17 sm:h-17 drop-shadow-md select-none">
        {/* Ground shadow */}
        <ellipse cx={35} cy={64} rx={22} ry={3.5} fill="rgba(0,0,0,0.4)" />

        {/* 1. REAR WHEEL with spinning spokes */}
        <g transform={`rotate(${wheelRotation}, ${rearWheelX}, ${wheelY})`}>
          <circle cx={rearWheelX} cy={wheelY} r={wheelR} stroke="#0f172a" strokeWidth={2.5} fill="none" />
          <circle cx={rearWheelX} cy={wheelY} r={wheelR - 2} stroke="#64748b" strokeWidth={0.8} fill="none" />
          <circle cx={rearWheelX} cy={wheelY} r={2.5} fill="#334155" />
          <line x1={rearWheelX - wheelR} y1={wheelY} x2={rearWheelX + wheelR} y2={wheelY} stroke="#94a3b8" strokeWidth={0.8} />
          <line x1={rearWheelX} y1={wheelY - wheelR} x2={rearWheelX} y2={wheelY + wheelR} stroke="#94a3b8" strokeWidth={0.8} />
          <line x1={rearWheelX - 10} y1={wheelY - 10} x2={rearWheelX + 10} y2={wheelY + 10} stroke="#94a3b8" strokeWidth={0.8} />
          <line x1={rearWheelX - 10} y1={wheelY + 10} x2={rearWheelX + 10} y2={wheelY - 10} stroke="#94a3b8" strokeWidth={0.8} />
        </g>

        {/* 2. FRONT WHEEL with spinning spokes */}
        <g transform={`rotate(${wheelRotation}, ${frontWheelX}, ${wheelY})`}>
          <circle cx={frontWheelX} cy={wheelY} r={wheelR} stroke="#0f172a" strokeWidth={2.5} fill="none" />
          <circle cx={frontWheelX} cy={wheelY} r={wheelR - 2} stroke="#64748b" strokeWidth={0.8} fill="none" />
          <circle cx={frontWheelX} cy={wheelY} r={2.5} fill="#334155" />
          <line x1={frontWheelX - wheelR} y1={wheelY} x2={frontWheelX + wheelR} y2={wheelY} stroke="#94a3b8" strokeWidth={0.8} />
          <line x1={frontWheelX} y1={wheelY - wheelR} x2={frontWheelX} y2={wheelY + wheelR} stroke="#94a3b8" strokeWidth={0.8} />
          <line x1={frontWheelX - 10} y1={wheelY - 10} x2={frontWheelX + 10} y2={wheelY + 10} stroke="#94a3b8" strokeWidth={0.8} />
          <line x1={frontWheelX - 10} y1={wheelY + 10} x2={frontWheelX + 10} y2={wheelY - 10} stroke="#94a3b8" strokeWidth={0.8} />
        </g>

        {/* 3. BICYCLE FRAME */}
        <g stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Rear triangle */}
          <polyline points={`${rearWheelX},${wheelY} ${saddleX},${saddleY} ${bbX},${bbY} ${rearWheelX},${wheelY}`} />
          {/* Front triangle */}
          <polyline points={`${saddleX},${saddleY} ${handleX},${handleY} ${bbX},${bbY}`} />
          {/* Front fork */}
          <line x1={handleX} y1={handleY} x2={frontWheelX} y2={wheelY} stroke="#475569" strokeWidth={2} />
        </g>

        {/* Saddle & Handlebar */}
        <line x1={saddleX - 4} y1={saddleY - 1} x2={saddleX + 3} y2={saddleY - 1} stroke="#0f172a" strokeWidth={3} strokeLinecap="round" />
        <path d={`M ${handleX - 2} ${handleY - 2} L ${handleX + 3} ${handleY - 2} A 3 3 0 0 1 ${handleX + 4} ${handleY + 3}`} stroke="#0f172a" strokeWidth={2.5} fill="none" strokeLinecap="round" />

        {/* 4. CYCLIST RIDER */}
        {/* Torso */}
        <line x1={hipX} y1={hipY} x2={shoulderX} y2={shoulderY} stroke={color} strokeWidth={7} strokeLinecap="round" />
        {/* Arm to handlebar */}
        <polyline points={`${shoulderX},${shoulderY} 44,26 ${handleX},${handleY}`} stroke="#e0a97a" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* Pumping leg */}
        <polyline points={`${hipX},${hipY} ${kneeX},${kneeY} ${pedalX},${pedalY}`} stroke="#0f172a" strokeWidth={3.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x={pedalX - 2} y={pedalY - 1} width={4} height={2} fill="#e11d48" />

        {/* Head with Aero Helmet */}
        <circle cx={43} cy={16} r={5} fill="#e0a97a" />
        {/* Sleek bicycle helmet */}
        <path d="M 38 16 Q 44 10 49 14 Q 51 17 48 18 Q 43 18 38 16 Z" fill="#0284c7" />
        {/* Sunglasses */}
        <rect x={44} y={15} width={4} height={2} rx={0.5} fill="#0f172a" />
      </svg>
    </div>
  );
};

/**
 * Realistic Sports Automobile with alloy wheels, headlights, and aerodynamic styling
 */
export const RealisticCar: React.FC<{
  color: string;
  speed_mps: number;
  elapsedTime_s: number;
  isRunning: boolean;
}> = ({ color, speed_mps, elapsedTime_s, isRunning }) => {
  const wheelRotation = isRunning ? (elapsedTime_s * speed_mps * 30) % 360 : 0;

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 80 50" className="w-18 h-12 sm:w-20 sm:h-13 drop-shadow-md select-none">
        {/* Ground shadow */}
        <ellipse cx={40} cy={44} rx={34} ry={4} fill="rgba(0,0,0,0.5)" />

        {/* Exhaust fumes when driving */}
        {isRunning && (
          <g opacity={0.6}>
            <circle cx={4} cy={38} r={2} fill="#94a3b8" />
            <circle cx={-2} cy={36} r={3} fill="#cbd5e1" opacity={0.4} />
          </g>
        )}

        {/* Headlight beam */}
        <polygon points="72,33 80,28 80,42 72,37" fill="#fef08a" opacity={0.4} />

        {/* Car Body Lower */}
        <path
          d="M 6 36 L 10 32 L 20 32 Q 26 32 28 36 L 52 36 Q 54 32 60 32 L 72 34 Q 76 35 76 38 L 74 41 L 6 41 Z"
          fill={color}
        />

        {/* Aerodynamic Cabin & Windshield */}
        <path
          d="M 18 32 L 28 20 Q 32 18 42 18 L 56 19 L 68 32 Z"
          fill={color}
          filter="brightness(0.9)"
        />

        {/* Windows (Tinted glass) */}
        <path
          d="M 30 22 L 40 22 L 40 31 L 24 31 Z"
          fill="#1e293b"
          opacity={0.85}
        />
        <path
          d="M 43 22 L 54 22 L 64 31 L 43 31 Z"
          fill="#38bdf8"
          opacity={0.75}
        />

        {/* Headlight & Taillight */}
        <rect x={73} y={34} width={3} height={3} rx={1} fill="#fef08a" />
        <rect x={6} y={34} width={2.5} height={4} rx={1} fill="#e11d48" />

        {/* REAR WHEEL (Alloy Rim with Spinning Effect) */}
        <g transform={`rotate(${wheelRotation}, 20, 39)`}>
          <circle cx={20} cy={39} r={7.5} fill="#0f172a" />
          <circle cx={20} cy={39} r={5} fill="#e2e8f0" stroke="#475569" strokeWidth={1} />
          <circle cx={20} cy={39} r={2} fill="#0f172a" />
          <line x1={15} y1={39} x2={25} y2={39} stroke="#64748b" strokeWidth={1} />
          <line x1={20} y1={34} x2={20} y2={44} stroke="#64748b" strokeWidth={1} />
        </g>

        {/* FRONT WHEEL */}
        <g transform={`rotate(${wheelRotation}, 60, 39)`}>
          <circle cx={60} cy={39} r={7.5} fill="#0f172a" />
          <circle cx={60} cy={39} r={5} fill="#e2e8f0" stroke="#475569" strokeWidth={1} />
          <circle cx={60} cy={39} r={2} fill="#0f172a" />
          <line x1={55} y1={39} x2={65} y2={39} stroke="#64748b" strokeWidth={1} />
          <line x1={60} y1={34} x2={60} y2={44} stroke="#64748b" strokeWidth={1} />
        </g>
      </svg>
    </div>
  );
};

/**
 * Realistic City Transit Bus
 */
export const RealisticBus: React.FC<{
  color: string;
  speed_mps: number;
  elapsedTime_s: number;
  isRunning: boolean;
}> = ({ color, speed_mps, elapsedTime_s, isRunning }) => {
  const wheelRotation = isRunning ? (elapsedTime_s * speed_mps * 20) % 360 : 0;

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 90 55" className="w-20 h-13 sm:w-24 sm:h-15 drop-shadow-md select-none">
        {/* Ground shadow */}
        <ellipse cx={45} cy={49} rx={40} ry={4.5} fill="rgba(0,0,0,0.45)" />

        {/* Bus Body */}
        <rect x={6} y={15} width={76} height={28} rx={4} fill={color} />
        <rect x={6} y={35} width={76} height={8} fill="#1e293b" opacity={0.3} />

        {/* Windows Row */}
        <rect x={12} y={18} width={10} height={12} rx={1.5} fill="#38bdf8" opacity={0.8} />
        <rect x={25} y={18} width={12} height={12} rx={1.5} fill="#38bdf8" opacity={0.8} />
        <rect x={40} y={18} width={12} height={12} rx={1.5} fill="#38bdf8" opacity={0.8} />
        <rect x={55} y={18} width={12} height={12} rx={1.5} fill="#38bdf8" opacity={0.8} />
        <rect x={70} y={18} width={10} height={14} rx={1.5} fill="#0284c7" opacity={0.9} />

        {/* Headlight & Taillight */}
        <rect x={81} y={36} width={2} height={4} rx={0.5} fill="#fef08a" />
        <rect x={5} y={36} width={2} height={4} rx={0.5} fill="#e11d48" />

        {/* Wheels */}
        <g transform={`rotate(${wheelRotation}, 24, 44)`}>
          <circle cx={24} cy={44} r={6.5} fill="#0f172a" />
          <circle cx={24} cy={44} r={3.5} fill="#94a3b8" />
        </g>
        <g transform={`rotate(${wheelRotation}, 68, 44)`}>
          <circle cx={68} cy={44} r={6.5} fill="#0f172a" />
          <circle cx={68} cy={44} r={3.5} fill="#94a3b8" />
        </g>
      </svg>
    </div>
  );
};

/**
 * Universal Realistic Entity Dispatcher
 */
export const RealisticEntity: React.FC<RealisticEntityProps> = (props) => {
  const detected = detectEntityType(props.avatarText, props.name, props.type);

  switch (detected) {
    case 'bus':
      return <RealisticBus {...props} />;
    case 'car':
      return <RealisticCar {...props} />;
    case 'cyclist':
      return <RealisticCyclist {...props} />;
    case 'walker':
      return <RealisticRunner {...props} isWalker={true} />;
    case 'sprinter':
    default:
      return <RealisticRunner {...props} isWalker={false} />;
  }
};
