import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

const STORAGE_KEY = 'cbdp_hrm_active_project_id';

export function ProjectProvider({ children }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectIdState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || '';
  });
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState(null);

  // Fetch all accessible projects
  const fetchProjects = useCallback(async (preferredId = null) => {
    try {
      setLoadingProjects(true);
      setProjectsError(null);
      const res = await api.get('/projects');

      if (res.data?.success && Array.isArray(res.data.data)) {
        const fetched = res.data.data;
        setProjects(fetched);

        // Determine which project should be selected
        const savedId = preferredId || localStorage.getItem(STORAGE_KEY);
        const existsInFetched = fetched.some(p => String(p._id) === String(savedId));

        if (savedId && existsInFetched) {
          setSelectedProjectIdState(savedId);
        } else if (fetched.length > 0) {
          // Default to default project or first active project
          const defaultProj = fetched.find(p => p.isDefault) || fetched.find(p => p.status === 'ACTIVE') || fetched[0];
          const newId = String(defaultProj._id);
          setSelectedProjectIdState(newId);
          localStorage.setItem(STORAGE_KEY, newId);
        } else {
          setSelectedProjectIdState('');
        }
      }
    } catch (err) {
      console.error('[ProjectContext] Failed to load projects:', err);
      setProjectsError(err.response?.data?.message || err.message);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // Initial load when user logs in
  useEffect(() => {
    if (user && user.role !== 'EMPLOYEE') {
      fetchProjects();
    }
  }, [user, fetchProjects]);

  // Set active project by ID with persistence
  const setSelectedProjectId = useCallback((id) => {
    if (!id) return;
    const strId = String(id);
    setSelectedProjectIdState(strId);
    localStorage.setItem(STORAGE_KEY, strId);
  }, []);

  // Computed selected project object
  const selectedProject = projects.find(p => String(p._id) === String(selectedProjectId)) || projects[0] || null;

  // Actions
  const createProject = async (projectData) => {
    const res = await api.post('/projects', projectData);
    if (res.data?.success) {
      await fetchProjects(res.data.data._id);
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to create project');
  };

  const updateProject = async (id, projectData) => {
    const res = await api.put(`/projects/${id}`, projectData);
    if (res.data?.success) {
      await fetchProjects(selectedProjectId);
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to update project');
  };

  const updateProjectStatus = async (id, status, reason = '') => {
    const res = await api.patch(`/projects/${id}/status`, { status, reason });
    if (res.data?.success) {
      await fetchProjects(selectedProjectId);
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to update project status');
  };

  const archiveProject = async (id) => {
    const res = await api.delete(`/projects/${id}`);
    if (res.data?.success) {
      await fetchProjects();
      return true;
    }
    throw new Error(res.data?.message || 'Failed to archive project');
  };

  const assignUsers = async (id, assignedUsers) => {
    const res = await api.post(`/projects/${id}/assign`, { assignedUsers });
    if (res.data?.success) {
      await fetchProjects(selectedProjectId);
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to assign project users');
  };

  const value = {
    projects,
    selectedProject,
    selectedProjectId,
    setSelectedProjectId,
    loadingProjects,
    projectsError,
    refreshProjects: fetchProjects,
    createProject,
    updateProject,
    updateProjectStatus,
    archiveProject,
    assignUsers,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
