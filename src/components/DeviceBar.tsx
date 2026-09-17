"use client";

import { DEVICES, type DeviceId } from "@/lib/types";

export default function DeviceBar({
  value,
  onChange,
  compact = false,
}: {
  value: DeviceId;
  onChange: (id: DeviceId) => void;
  compact?: boolean;
}) {
  return (
    <div className="inline-flex rounded-lg border border-ink-600 bg-ink-900 p-0.5">
      {DEVICES.map((device) => {
        const active = device.id === value;
        return (
          <button
            key={device.id}
            type="button"
            onClick={() => onChange(device.id)}
            title={`${device.label} · ${device.width} px`}
            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-amber-brand text-ink-950"
                : "text-mist-300 hover:bg-ink-800 hover:text-mist-100"
            }`}
          >
            {compact ? device.label.slice(0, 1) : device.label}
          </button>
        );
      })}
    </div>
  );
}
