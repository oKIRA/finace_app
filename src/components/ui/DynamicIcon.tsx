import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = 'w-5 h-5', size }) => {
  // Try to find the icon in Lucide, fallback to Tag or Circle
  const IconComponent = (LucideIcons as any)[name] || (LucideIcons as any)['Tag'] || LucideIcons.Circle;
  return <IconComponent className={className} size={size} />;
};
