'use client'

const AMENITIES = [
  { value: 'wifi', label: 'WiFi', icon: '📶' },
  { value: 'water', label: 'Running Water', icon: '💧' },
  { value: 'generator', label: 'Generator', icon: '⚡' },
  { value: 'security', label: 'Security', icon: '🔒' },
  { value: 'parking', label: 'Parking', icon: '🚗' },
  { value: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { value: 'bathroom_ensuite', label: 'Ensuite Bathroom', icon: '🚿' },
  { value: 'fence', label: 'Fenced Compound', icon: '🏠' },
  { value: 'borehole', label: 'Borehole', icon: '🪣' },
]

type AmenitiesPickerProps = {
  value: string[]
  onChange: (val: string[]) => void
  error?: string
}

export function AmenitiesPicker({ value, onChange, error }: AmenitiesPickerProps) {
  function toggle(amenity: string) {
    if (value.includes(amenity)) {
      onChange(value.filter((a) => a !== amenity))
    } else {
      onChange([...value, amenity])
    }
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {AMENITIES.map((amenity) => {
          const selected = value.includes(amenity.value)
          return (
            <button
              key={amenity.value}
              type="button"
              onClick={() => toggle(amenity.value)}
              className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors ${
                selected
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              <span className="text-xl">{amenity.icon}</span>
              <span className="text-xs leading-tight">{amenity.label}</span>
            </button>
          )
        })}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}