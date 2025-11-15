"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, Building2, MapPin, Target } from "lucide-react"
import type { SavedJob } from "@/lib/types"

interface JobSelectorProps {
  isOpen: boolean
  onClose: () => void
  jobs: SavedJob[]
  onSelectJob: (job: SavedJob) => void
  loading?: boolean
}

export function JobSelector({ isOpen, onClose, jobs, onSelectJob, loading = false }: JobSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (job: SavedJob) => {
    onSelectJob(job)
    onClose()
    setSearchTerm("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select a Job to Practice For</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by job title or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Jobs List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading jobs...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground mb-2">
                  {searchTerm ? "No jobs found matching your search" : "No saved jobs yet"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm ? "Try a different search term" : "Save some jobs to start practicing!"}
                </p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/30"
                  onClick={() => handleSelect(job)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-lg leading-tight">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-4 w-4" />
                          <span>{job.company}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                      </div>
                      {job.summary && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {job.summary}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {job.matchingScore !== undefined && job.matchingScore > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Target className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-primary">
                            {job.matchingScore}%
                          </span>
                        </div>
                      )}
                      <Badge variant="outline">
                        {job.status === 'saved' ? 'Saved' :
                         job.status === 'applied' ? 'Applied' :
                         job.status === 'interviewing' ? 'Interviewing' :
                         job.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
