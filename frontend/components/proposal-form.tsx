"use client"

import { useState } from "react"
import { FileText, Upload, CheckCircle2, Send, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppStore } from "@/lib/store"

interface ProposalFormProps {
  onSuccess?: () => void
}

export function ProposalForm({ onSuccess }: ProposalFormProps) {
  const { currentUser } = useAppStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [documentsUploaded, setDocumentsUploaded] = useState(false)
  const [vvbDocsUploaded, setVvbDocsUploaded] = useState(false)

  // Internal simulated sensor data base for submission
  const [sensorData] = useState({
    device_id: `IOT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    temperature_c: 24 + Math.round(Math.random() * 6),
    humidity_pct: 75 + Math.round(Math.random() * 20),
    ndvi_score: +(0.55 + Math.random() * 0.3).toFixed(4),
  })

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
        },
        (error) => {
          console.error("Error obtaining location", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !quantity || !currentUser) return

    setIsSubmitting(true)

    const freshTimestamp = new Date().toISOString()
    const sensorDataWithQuantity = {
      ...sensorData,
      co2_sequestered_tons: parseInt(quantity),
      recorded_at: freshTimestamp // Timestamp Realism
    }

    try {
      const res = await fetch(`http://localhost:5000/api/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          producer_id: currentUser.id,
          title,
          description,
          commodity_type: 'carbon_credit',
          credit_quantity: parseInt(quantity),
          sensor_data: sensorDataWithQuantity,
          location: { lat: latitude, lon: longitude }
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        console.error("Failed to submit proposal. Error payload:", errorData || res.statusText);
        throw new Error("API submission failed");
      }

      const data = await res.json();
      
      // Update local state if needed via store methods
      useAppStore.getState().fetchInitialData();
      useAppStore.getState().addNotification(`New proposal "${title}" submitted`, 'info');

      setIsSubmitting(false)
      setSubmitted(true)
      
      setTimeout(() => {
        setSubmitted(false)
        setTitle('')
        setDescription('')
        setQuantity('')
        setLatitude('')
        setLongitude('')
        setDocumentsUploaded(false)
        setVvbDocsUploaded(false)
        onSuccess?.()
      }, 2000)

    } catch (err) {
      console.error("Submission error:", err);
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center py-16">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary">
            <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">PDD Submitted!</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Your Project Design Document has been submitted for verification.
            You will be notified once a Validation/Verification Body reviews your submission.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Main Form */}
      <div className="lg:col-span-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              Project Design Document (PDD) Initiation
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Initiate your carbon mitigation project design document for VVB review and credit issuance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Project Title</label>
              <Input
                placeholder="e.g., Amazon Reforestation Plot B — 100 Ton Batch"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>

            {/* Baseline Scenario & Methodology */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Baseline Scenario & Methodology Definition</label>
              <Textarea
                placeholder="Define the baseline scenario, reference methodology (e.g., VM0015, AR-ACM0003), additionality argument, and expected mitigation pathway..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-secondary border-border text-foreground min-h-32"
              />
            </div>

            {/* Geolocation Fields */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Project Geo-Coordinates</label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUseCurrentLocation}
                  className="h-7 text-xs flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" /> Use Current Location
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Input
                    placeholder="Latitude (e.g., 10.17)"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="bg-secondary border-border text-foreground"
                  />
                  <p className="text-[10px] text-muted-foreground">Latitude</p>
                </div>
                <div className="space-y-1">
                  <Input
                    placeholder="Longitude (e.g., 76.52)"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="bg-secondary border-border text-foreground"
                  />
                  <p className="text-[10px] text-muted-foreground">Longitude</p>
                </div>
              </div>
            </div>

            {/* Estimated Annual Mitigation */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Estimated Annual Mitigation (tCO2e)</label>
              <Input
                type="number"
                placeholder="Enter estimated annual emission reductions in tonnes"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Projected annual greenhouse gas emission reductions or removals in metric tonnes of CO2 equivalent
              </p>
            </div>

            {/* KYC & CDD Documentation Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">KYC & CDD Documentation</label>
              <div
                className={`flex cursor-pointer items-center justify-between rounded-lg border-2 border-dashed p-4 transition-colors ${
                  documentsUploaded
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
                onClick={() => setDocumentsUploaded(true)}
              >
                <div className="flex items-center gap-3">
                  {documentsUploaded ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <div className="text-sm text-foreground">
                      {documentsUploaded ? 'KYC & CDD documents uploaded' : 'Upload KYC documents, ownership records, and due diligence reports'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {documentsUploaded ? '3 files uploaded' : 'PDF, JPG, or PNG files up to 10MB each'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* VVB Audit Reports & Additionality Proof Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">VVB Audit Reports & Additionality Proof</label>
              <div
                className={`flex cursor-pointer items-center justify-between rounded-lg border-2 border-dashed p-4 transition-colors ${
                  vvbDocsUploaded
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
                onClick={() => setVvbDocsUploaded(true)}
              >
                <div className="flex items-center gap-3">
                  {vvbDocsUploaded ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <div className="text-sm text-foreground">
                      {vvbDocsUploaded ? 'VVB audit reports uploaded' : 'Upload third-party validation reports and additionality evidence'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {vvbDocsUploaded ? '2 files uploaded' : 'Validation/Verification Body reports, baseline studies, barrier analysis'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!title || !description || !quantity || isSubmitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit PDD for Verification
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
