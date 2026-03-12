"use client"

import { useState, useEffect } from "react"
import { Satellite, Signal, CheckCircle2, Thermometer, Droplets, Leaf, Radio } from "lucide-react"

// ═══════════════════════════════════════════════════════════════
//  Satellite Panel — NDVI Heatmap + Geospatial Data Display
// ═══════════════════════════════════════════════════════════════

interface SatellitePanelProps {
  ndviScore?: number
  temperature?: number
  humidity?: number
  deviceId?: string
  co2Tons?: number
  projectTitle?: string
  compact?: boolean
}

// Generate a mock NDVI heatmap grid
function NDVIHeatmap({ ndvi }: { ndvi: number }) {
  const [cells, setCells] = useState<number[]>([])

  useEffect(() => {
    // Generate 8x6 grid of NDVI-adjacent values
    const grid: number[] = []
    for (let i = 0; i < 48; i++) {
      const variance = (Math.random() - 0.5) * 0.3
      grid.push(Math.max(0, Math.min(1, ndvi + variance)))
    }
    setCells(grid)
  }, [ndvi])

  const getColor = (val: number) => {
    if (val > 0.7) return 'bg-emerald-500'
    if (val > 0.6) return 'bg-emerald-600'
    if (val > 0.5) return 'bg-green-600'
    if (val > 0.4) return 'bg-yellow-600'
    if (val > 0.3) return 'bg-orange-600'
    return 'bg-red-700'
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Satellite className="h-3.5 w-3.5 text-blue-400" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Sentinel-2 NDVI Capture
        </span>
        <div className="flex items-center gap-1 ml-auto">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-emerald-400">Live</span>
        </div>
      </div>
      <div className="grid grid-cols-8 gap-[2px] rounded-lg overflow-hidden border border-border p-1 bg-black/20">
        {cells.map((val, i) => (
          <div
            key={i}
            className={`aspect-square rounded-[2px] ${getColor(val)} transition-colors`}
            title={`NDVI: ${val.toFixed(2)}`}
            style={{ opacity: 0.7 + val * 0.3 }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 px-1">
        <span>Low (0.0)</span>
        <div className="flex gap-px">
          <div className="h-2 w-3 bg-red-700 rounded-sm" />
          <div className="h-2 w-3 bg-orange-600 rounded-sm" />
          <div className="h-2 w-3 bg-yellow-600 rounded-sm" />
          <div className="h-2 w-3 bg-green-600 rounded-sm" />
          <div className="h-2 w-3 bg-emerald-500 rounded-sm" />
        </div>
        <span>High (1.0)</span>
      </div>
    </div>
  )
}

export function SatellitePanel({ ndviScore = 0.72, temperature = 28, humidity = 75, deviceId = "SAT-SENTINEL-2B", co2Tons = 150, projectTitle, compact = false }: SatellitePanelProps) {
  const [telemetryTick, setTelemetryTick] = useState(0)
  const [liveNdvi, setLiveNdvi] = useState(ndviScore)
  const [liveTemp, setLiveTemp] = useState(temperature)
  const [liveHumidity, setLiveHumidity] = useState(humidity)

  // Simulate live telemetry updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryTick(t => t + 1)
      setLiveNdvi(n => +(n + (Math.random() - 0.5) * 0.01).toFixed(3))
      setLiveTemp(t => +(t + (Math.random() - 0.5) * 0.3).toFixed(1))
      setLiveHumidity(h => Math.min(100, Math.max(0, +(h + (Math.random() - 0.5) * 1).toFixed(0))))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const ndviPasses = liveNdvi >= 0.6

  if (compact) {
    return (
      <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Satellite className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-medium text-foreground">Satellite Feed</span>
          <div className="ml-auto flex items-center gap-1">
            <Signal className="h-3 w-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400">Connected</span>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">NDVI</div>
            <div className={`text-sm font-bold ${ndviPasses ? 'text-emerald-400' : 'text-orange-400'}`}>{liveNdvi.toFixed(3)}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">Temp</div>
            <div className="text-sm font-medium text-foreground">{liveTemp}°C</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">Humidity</div>
            <div className="text-sm font-medium text-foreground">{liveHumidity}%</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-muted-foreground">CO₂</div>
            <div className="text-sm font-medium text-foreground">{co2Tons}t</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <Satellite className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Satellite Telemetry</div>
            <div className="text-[10px] text-muted-foreground">Sentinel-2 MSI • Band 4/8 (NIR/Red)</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1">
            <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-400">LIVE</span>
          </div>
        </div>
      </div>

      {projectTitle && (
        <div className="text-xs text-muted-foreground">
          Monitoring: <span className="text-foreground font-medium">{projectTitle}</span>
        </div>
      )}

      {/* NDVI Heatmap */}
      <NDVIHeatmap ndvi={liveNdvi} />

      {/* Telemetry Readings */}
      <div className="grid grid-cols-4 gap-2">
        <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
          <Leaf className={`mx-auto h-4 w-4 ${ndviPasses ? 'text-emerald-400' : 'text-orange-400'}`} />
          <div className={`mt-1 text-lg font-bold ${ndviPasses ? 'text-emerald-400' : 'text-orange-400'}`}>
            {liveNdvi.toFixed(3)}
          </div>
          <div className="text-[9px] text-muted-foreground">NDVI Score</div>
          <div className={`mt-0.5 inline-flex items-center gap-0.5 text-[8px] ${ndviPasses ? 'text-emerald-400' : 'text-orange-400'}`}>
            <CheckCircle2 className="h-2 w-2" />
            {ndviPasses ? 'PASS' : 'BELOW 0.6'}
          </div>
        </div>

        <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
          <Thermometer className="mx-auto h-4 w-4 text-red-400" />
          <div className="mt-1 text-lg font-bold text-foreground">{liveTemp}°</div>
          <div className="text-[9px] text-muted-foreground">Temp (°C)</div>
        </div>

        <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
          <Droplets className="mx-auto h-4 w-4 text-blue-400" />
          <div className="mt-1 text-lg font-bold text-foreground">{liveHumidity}%</div>
          <div className="text-[9px] text-muted-foreground">Humidity</div>
        </div>

        <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
          <Leaf className="mx-auto h-4 w-4 text-primary" />
          <div className="mt-1 text-lg font-bold text-foreground">{co2Tons}</div>
          <div className="text-[9px] text-muted-foreground">tCO₂e</div>
        </div>
      </div>

      {/* Device Info */}
      <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 text-[10px]">
        <span className="font-mono text-muted-foreground">Device: {deviceId}</span>
        <span className="text-muted-foreground">Update #{telemetryTick} • Every 3s</span>
      </div>
    </div>
  )
}
