"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Header } from "@/components/header"
import { LandingPage } from "@/components/landing-page"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.replace("/saved-jobs")
    }
  }, [loading, user, router])

  return (
    <>
      <Header />
      <LandingPage />
    </>
  )
}


