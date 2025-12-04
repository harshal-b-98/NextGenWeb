/**
 * Device Switcher Component
 *
 * Toolbar component to toggle between device views (desktop/tablet/mobile)
 *
 * Epic: NextGenWeb Complete Product Reimplementation
 * Phase 2: Preview Studio & Refinement
 */

'use client';

import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeviceSwitcherProps {
  selected: 'desktop' | 'tablet' | 'mobile';
  onDeviceChange: (device: 'desktop' | 'tablet' | 'mobile') => void;
}

export function DeviceSwitcher({ selected, onDeviceChange }: DeviceSwitcherProps) {
  const devices = [
    { id: 'desktop' as const, icon: Monitor, label: 'Desktop' },
    { id: 'tablet' as const, icon: Tablet, label: 'Tablet' },
    { id: 'mobile' as const, icon: Smartphone, label: 'Mobile' },
  ];

  return (
    <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      {devices.map((device) => {
        const Icon = device.icon;
        const isSelected = selected === device.id;

        return (
          <button
            key={device.id}
            onClick={() => onDeviceChange(device.id)}
            className={`p-2 rounded-md transition-all ${
              isSelected
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            title={device.label}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
