"use client"

import { useState } from "react"
import { Leaf, CheckCircle2, Upload, User, FileText, Shield, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useAppStore } from "@/lib/store"

type KYCStep = 'identity' | 'documents' | 'verification' | 'complete'

export function KYCVerification() {
  const { currentUser, setCurrentView, completeKYC, submitKYCData } = useAppStore()
  const [currentStep, setCurrentStep] = useState<KYCStep>('identity')
  const [isVerifying, setIsVerifying] = useState(false)
  
  // Form states
  const [fullName, setFullName] = useState(currentUser?.display_name || '')
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('')
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual')
  const [companyName, setCompanyName] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [idUploaded, setIdUploaded] = useState(false)
  const [addressUploaded, setAddressUploaded] = useState(false)

  const steps: { key: KYCStep; label: string; icon: React.ReactNode }[] = [
    { key: 'identity', label: 'Identity', icon: <User className="h-4 w-4" /> },
    { key: 'documents', label: 'Documents', icon: <FileText className="h-4 w-4" /> },
    { key: 'verification', label: 'Verification', icon: <Shield className="h-4 w-4" /> },
    { key: 'complete', label: 'Complete', icon: <CheckCircle2 className="h-4 w-4" /> },
  ]

  const getStepProgress = () => {
    const stepIndex = steps.findIndex(s => s.key === currentStep)
    return ((stepIndex + 1) / steps.length) * 100
  }

  const handleIdentitySubmit = () => {
    if (accountType === 'individual' && fullName && email && country) {
      setCurrentStep('documents')
    } else if (accountType === 'company' && companyName && registrationNumber && email && country) {
      setCurrentStep('documents')
    }
  }

  const handleDocumentsSubmit = async () => {
    if (idUploaded && addressUploaded) {
      setCurrentStep('verification')
      setIsVerifying(true)
      
      // Submit KYC data to backend
      if (currentUser) {
        await submitKYCData({
          user_id: currentUser.id,
          account_type: accountType,
          full_name: accountType === 'individual' ? fullName : undefined,
          company_name: accountType === 'company' ? companyName : undefined,
          registration_number: accountType === 'company' ? registrationNumber : undefined,
          email,
          country,
        });
      }
      
      // Simulate verification process
      setTimeout(() => {
        setIsVerifying(false)
        setCurrentStep('complete')
        if (currentUser) {
          completeKYC(currentUser.id)
        }
      }, 3000)
    }
  }

  const handleComplete = () => {
    setCurrentView('role-select')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Leaf className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold text-foreground">CarbonX</span>
      </div>

      <Card className="w-full max-w-lg border-border bg-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-foreground">KYC Verification</CardTitle>
          <CardDescription className="text-muted-foreground">
            Complete verification to access the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Indicator */}
          <div className="space-y-4">
            <div className="flex justify-between">
              {steps.map((step, index) => (
                <div
                  key={step.key}
                  className={`flex flex-col items-center gap-1 ${
                    steps.findIndex(s => s.key === currentStep) >= index
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      steps.findIndex(s => s.key === currentStep) > index
                        ? 'border-primary bg-primary text-primary-foreground'
                        : steps.findIndex(s => s.key === currentStep) === index
                        ? 'border-primary text-primary'
                        : 'border-muted text-muted-foreground'
                    }`}
                  >
                    {steps.findIndex(s => s.key === currentStep) > index ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className="text-xs">{step.label}</span>
                </div>
              ))}
            </div>
            <Progress value={getStepProgress()} className="h-1" />
          </div>

          {/* Step Content */}
          {currentStep === 'identity' && (
            <div className="space-y-4">
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-foreground">Account Type</label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant={accountType === 'individual' ? 'default' : 'outline'}
                    onClick={() => setAccountType('individual')}
                    className={accountType === 'individual' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}
                  >
                    Individual
                  </Button>
                  <Button
                    variant={accountType === 'company' ? 'default' : 'outline'}
                    onClick={() => setAccountType('company')}
                    className={accountType === 'company' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}
                  >
                    Company / Organization
                  </Button>
                </div>
              </div>

              {accountType === 'individual' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Full Legal Name</label>
                    <Input
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Company Name</label>
                    <Input
                      placeholder="Enter registered company name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Registration Number (CIN/Tax ID)</label>
                    <Input
                      placeholder="Enter corporate registration number"
                      value={registrationNumber}
                      onChange={(e) => setRegistrationNumber(e.target.value)}
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium text-foreground">Business Email Address</label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Country of Registration/Residence</label>
                <Input
                  placeholder="Enter your country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-4"
                onClick={handleIdentitySubmit}
                disabled={accountType === 'individual' ? (!fullName || !email || !country) : (!companyName || !registrationNumber || !email || !country)}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {currentStep === 'documents' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  {accountType === 'individual' ? 'Government-Issued ID' : 'Certificate of Incorporation'}
                </label>
                <div
                  className={`flex cursor-pointer items-center justify-between rounded-lg border-2 border-dashed p-4 transition-colors ${
                    idUploaded
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => setIdUploaded(true)}
                >
                  <div className="flex items-center gap-3">
                    {idUploaded ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="text-sm text-foreground">
                        {idUploaded ? 'Primary_Document.pdf' : (accountType === 'individual' ? 'Upload passport or national ID' : 'Upload corporate registration certificate')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {idUploaded ? 'Uploaded successfully' : 'PDF, JPG or PNG up to 10MB'}
                      </div>
                    </div>
                  </div>
                  {idUploaded && (
                    <span className="text-xs text-primary">Verified</span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  {accountType === 'individual' ? 'Proof of Address' : 'Corporate Bank Statement / Tax Document'}
                </label>
                <div
                  className={`flex cursor-pointer items-center justify-between rounded-lg border-2 border-dashed p-4 transition-colors ${
                    addressUploaded
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => setAddressUploaded(true)}
                >
                  <div className="flex items-center gap-3">
                    {addressUploaded ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="text-sm text-foreground">
                        {addressUploaded ? 'Secondary_Document.pdf' : (accountType === 'individual' ? 'Upload utility bill or bank statement' : 'Upload recent corporate bank statement')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {addressUploaded ? 'Uploaded successfully' : 'Document from last 3 months'}
                      </div>
                    </div>
                  </div>
                  {addressUploaded && (
                    <span className="text-xs text-primary">Verified</span>
                  )}
                </div>
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleDocumentsSubmit}
                disabled={!idUploaded || !addressUploaded}
              >
                Submit for Verification
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {currentStep === 'verification' && (
            <div className="flex flex-col items-center py-8">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Verifying Your Documents</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Our automated system is reviewing your submitted documents. 
                This usually takes a few moments.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>256-bit encrypted verification</span>
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="flex flex-col items-center py-8">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Verification Complete</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Your identity has been verified successfully. You can now 
                access all features of the CarbonX marketplace.
              </p>
              <div className="mt-6 w-full space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                  <span className="text-sm text-muted-foreground">KYC Status</span>
                  <span className="text-sm font-medium text-primary">Verified</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                  <span className="text-sm text-muted-foreground">Wallet</span>
                  <span className="text-sm font-mono text-foreground">
                    {currentUser?.wallet_address.slice(0, 6)}...{currentUser?.wallet_address.slice(-4)}
                  </span>
                </div>
              </div>
              <Button
                className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleComplete}
              >
                Choose Your Role
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
