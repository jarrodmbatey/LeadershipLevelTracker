import { cn } from "@/lib/utils";

interface LeadershipLevelBarProps {
  currentScore: number;
}

export default function LeadershipLevelBar({ currentScore }: LeadershipLevelBarProps) {
  // Define leadership levels with their ranges and colors
  const levels = [
    { name: "Position", range: [0, 39], color: "bg-green-200" },
    { name: "Permission", range: [40, 59], color: "bg-green-300" },
    { name: "Production", range: [60, 79], color: "bg-green-400" },
    { name: "People Development", range: [80, 94], color: "bg-green-500" },
    { name: "Pinnacle", range: [95, 100], color: "bg-yellow-400" }
  ];

  // Calculate the position of the indicator dot
  const dotPosition = `${currentScore}%`;

  return (
    <div className="relative pt-6 pb-8">
      {/* Level labels above */}
      <div className="absolute top-0 left-0 right-0 flex">
        {levels.map((level) => (
          <div 
            key={level.name}
            className="text-xs text-center text-muted-foreground"
            style={{ 
              width: `${level.range[1] - level.range[0]}%`,
              marginLeft: level.range[0] === 0 ? '0' : undefined
            }}
          >
            {level.name}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-4 flex rounded-full overflow-hidden">
        {levels.map((level) => (
          <div
            key={level.name}
            className={cn(
              level.color,
              "h-full transition-all duration-300"
            )}
            style={{
              width: `${level.range[1] - level.range[0]}%`
            }}
          />
        ))}
      </div>

      {/* Percentage ranges below */}
      <div className="absolute bottom-0 left-0 right-0 flex">
        {levels.map((level) => (
          <div 
            key={level.name}
            className="text-xs text-center text-muted-foreground"
            style={{ 
              width: `${level.range[1] - level.range[0]}%`,
              marginLeft: level.range[0] === 0 ? '0' : undefined
            }}
          >
            {level.range[0]}-{level.range[1]}%
          </div>
        ))}
      </div>

      {/* Current position indicator */}
      <div 
        className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-destructive rounded-full shadow-lg border-2 border-white -ml-3"
        style={{ left: dotPosition }}
      />
    </div>
  );
}