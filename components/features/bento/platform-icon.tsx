import svgPaths from "./repository-svgs";
// import imgImage78 from "figma:asset/7df6822e43d4d9c07277701e1560e104ade4db68.png";

interface PlatformIconProps {
  platform: 'github' | 'huggingface';
  size?: number;
}

export function PlatformIcon({ platform, size = 20 }: PlatformIconProps) {
  if (platform === 'github') {
    return (
      <div className="shrink-0" style={{ width: size, height: size }}>
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 20 20"
        >
          <g>
            <path d={svgPaths.pc971500} fill="#161514" />
            <path d={svgPaths.p30729300} fill="#161514" />
            <path d={svgPaths.p7c5de00} fill="#161514" />
            <path d={svgPaths.p14a1100} fill="#161514" />
            <path d={svgPaths.p2dc3bbc0} fill="#161514" />
            <path d={svgPaths.pa339200} fill="#161514" />
            <path d={svgPaths.p4416700} fill="#161514" />
            <path d={svgPaths.p4068b00} fill="#161514" />
          </g>
        </svg>
      </div>
    );
  } else if (platform === 'huggingface') {
    return (
      <div className="shrink-0" style={{ width: size, height: size }}>
        <svg
          className="block size-full"
          fill="none"
          preserveAspectRatio="none"
          viewBox="0 0 95 88"
          xmlns="http://www.w3.org/2000/svg"
        >
            <path d={svgPaths.hf_1} fill="#FFD21E" />
            <path d={svgPaths.hf_2} fill="#FF9D0B" />
            <path d={svgPaths.hf_3} fill="#3A3B45" />
            <path d={svgPaths.hf_4} fill="#FF323D" />
            <path d={svgPaths.hf_5} fill="#3A3B45" />
            <path d={svgPaths.hf_6} fill="#FF9D0B" />
            <path d={svgPaths.hf_7} fill="#FFD21E" />
            <path d={svgPaths.hf_8} fill="#FF9D0B" />
            <path d={svgPaths.hf_9} fill="#FFD21E" />
        </svg>
      </div>
    );
  }

  return (
    <div 
      className="bg-center bg-cover bg-no-repeat shrink-0"
      style={{ 
        width: size + 4, 
        height: size + 4,
        // backgroundImage: `url('${imgImage78}')` 
      }}
    />
  );
}