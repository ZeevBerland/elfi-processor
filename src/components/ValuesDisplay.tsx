import React from 'react';
import { HeartIcon, CircleDotIcon, ActivityIcon, FlameIcon, DropletsIcon, HeartPulseIcon, TrendingUpIcon, SmileIcon } from 'lucide-react';

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  unit?: string;
}

const MetricCard = ({
  icon: Icon,
  label,
  value,
  unit = ''
}: MetricCardProps) => (
  <div className="flex flex-col items-center p-3 sm:p-4 rounded-lg backdrop-blur-sm bg-white/5 border border-white/20 transition-all hover:bg-white/10">
    <div className="rounded-full p-2 bg-white/10 mb-2">
      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
    </div>
    <p className="text-xs sm:text-sm text-blue-100 mb-1 text-center">{label}</p>
    <div className="flex items-baseline">
      <span className="text-xl sm:text-2xl font-bold text-white">{value}</span>
      {unit && <span className="text-xs sm:text-sm text-blue-200 ml-1">{unit}</span>}
    </div>
  </div>
);

interface ValuesDisplayProps {
  metrics?: Record<string, number> | null;
}

const ValuesDisplay: React.FC<ValuesDisplayProps> = ({ metrics }) => {
  // If no metrics provided, don't render anything
  if (!metrics) return null;
  
  // Map API result keys to display labels and icons
  const metricConfig: Record<string, { label: string; icon: React.ElementType; unit?: string }> = {
    HR: { label: 'Heart Rate', icon: HeartIcon, unit: 'bpm' },
    BloodCirculation: { label: 'Blood Circulation', icon: CircleDotIcon },
    FitnessRaw: { label: 'Fitness Raw', icon: ActivityIcon },
    Metabolism: { label: 'Metabolism', icon: FlameIcon },
    Hydration: { label: 'Hydration', icon: DropletsIcon },
    Calmness: { label: 'Calmness', icon: HeartPulseIcon },
    FitnessAvg: { label: 'Fitness Avg', icon: TrendingUpIcon },
    Wellness: { label: 'Wellness', icon: SmileIcon },
  };
  
  // Create metric cards from the API results
  const metricCards = Object.entries(metrics)
    .filter(([key]) => key in metricConfig) // Only include metrics we have config for
    .map(([key, value]) => {
      const config = metricConfig[key] || { label: key, icon: CircleDotIcon };
      return {
        id: key, // Use id instead of key to avoid conflict with the React key prop
        icon: config.icon,
        label: config.label,
        value: value,
        unit: config.unit
      };
    });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 w-full mx-auto">
      {metricCards.map(metric => (
        <MetricCard key={metric.id} {...metric} />
      ))}
    </div>
  );
};

export default ValuesDisplay;