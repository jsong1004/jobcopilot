"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AuthModal } from "@/components/auth-modal"
import { 
  FileText, 
  Target, 
  Zap, 
  CheckCircle, 
  ArrowRight, 
  Users,
  TrendingUp,
  Shield
} from "lucide-react"
import Link from "next/link"

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')

  useEffect(() => {
    // Component mounted successfully
  }, [])

  const handleGetStarted = () => {
    setAuthMode('signup')
    setShowAuthModal(true)
  }

  const handleSignIn = () => {
    setAuthMode('signin')
    setShowAuthModal(true)
  }

  const features = [
    {
      icon: Target,
      title: "Matching Score Analyzer",
      description: "Instantly see how well your resume matches each job with clear, actionable scoring and gap highlights."
    },
    {
      icon: FileText,
      title: "Resume Tailoring Assistant",
      description: "Get precise, role-specific suggestions to tailor your resume bullet points, keywords, and impact."
    },
    {
      icon: Users,
      title: "Application Tracking",
      description: "Organize saved roles, track application status, and keep notes — all in one streamlined dashboard."
    },
    {
      icon: TrendingUp,
      title: "Actionable Insights",
      description: "Unlock insights to raise your score — skills to add, keywords to include, and sections to improve."
    }
  ]

  const benefits = [
    "Save hours of manual job searching",
    "Get higher-quality job matches",
    "Increase interview callback rates",
    "Organize your entire job search",
    "Access to premium resume tools",
    "AI-powered career insights"
  ]

  const stats = [
    { number: "Matching", label: "Score Engine" },
    { number: "Resume", label: "Tailoring" },
    { number: "Application", label: "Tracking" },
    { number: "Free", label: "To Get Started" }
  ]

  return (
    <>
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                Optimize Your
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}Matching Score{" "}
                </span>
                with AI
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                Analyze matching scores, tailor your resume to each role, and track applications — all in one place.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="text-lg px-8 py-6"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSignIn}
                  className="text-lg px-8 py-6"
                >
                  Sign In
                </Button>
              </div>
              
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Why Choose MyJob?
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Our AI helps you raise your matching score, tailor faster, and stay organized from search to offer.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {features.map((feature, index) => (
                  <Card key={index} className="border-2 border-transparent hover:border-primary/20 transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                          <feature.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                          <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  Boost Your Matching Score & Applications
                </h2>
                <p className="text-xl text-muted-foreground">
                  Use AI to tailor faster, apply smarter, and track everything with ease.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-6">What You'll Get:</h3>
                  <div className="space-y-4">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-lg">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white p-8 rounded-xl shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    <h3 className="text-xl font-semibold">Success Stories</h3>
                  </div>
                  <blockquote className="text-muted-foreground italic mb-4">
                    "MyJob's matching score and tailoring helped me land interviews in 2 weeks.
                    Clear guidance made updates easy."
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      S
                    </div>
                    <div>
                      <div className="font-medium">Sarah Chen</div>
                      <div className="text-sm text-muted-foreground">Software Engineer</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to boost your matching score?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Tailor your resume and track applications with AI.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleGetStarted}
                  className="text-lg px-8 py-6"
                >
                  Start Improving Your Score
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-6 mt-12 text-sm opacity-75">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>100% Free to Start</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Join Our Community</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>Instant Setup</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </>
  )
}