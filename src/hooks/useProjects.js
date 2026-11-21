import { useEffect, useState } from 'react'
import { useAuth } from './useAuth.js'
import { watchProject, watchUserProjects } from '@/features/projects/projectsService.js'

export function useProjects() {
  const { user } = useAuth()
  const [state, setState] = useState({ projects: [], loading: true, error: null })

  useEffect(() => {
    if (!user) return
    return watchUserProjects(
      user.uid,
      (projects) => setState({ projects, loading: false, error: null }),
      (error) => {
        console.error('useProjects:', error.code, error.message)
        setState((s) => ({ ...s, loading: false, error }))
      },
    )
  }, [user])

  return state
}

export function useProject(id) {
  const [state, setState] = useState({ project: null, loading: true, error: null })

  useEffect(() => {
    if (!id) return
    return watchProject(
      id,
      (project) => setState({ project, loading: false, error: null }),
      (error) => setState({ project: null, loading: false, error }),
    )
  }, [id])

  return state
}
