import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const [projectSwitchVersion, setProjectSwitchVersion] = useState(0);

  // Registry of open/dirty forms in the 4 project-linked modules to prevent cross-project form submission
  const unsavedFormsRef = useRef(new Map());
  const [unsavedFormsCount, setUnsavedFormsCount] = useState(0);

  const registerUnsavedForm = useCallback((formId, label = 'Unsaved form') => {
    if (!formId) return;
    unsavedFormsRef.current.set(formId, label);
    setUnsavedFormsCount(unsavedFormsRef.current.size);
  }, []);

  const unregisterUnsavedForm = useCallback((formId) => {
    if (!formId) return;
    if (unsavedFormsRef.current.has(formId)) {
      unsavedFormsRef.current.delete(formId);
      setUnsavedFormsCount(unsavedFormsRef.current.size);
    }
  }, []);

  // Fetch all accessible projects validated against backend authorization
  const fetchProjects = useCallback(async (preferredId = null) => {
    try {
      setLoadingProjects(true);
      setProjectsError(null);
      const res = await api.get('/projects');

      if (res.data?.success && Array.isArray(res.data.data)) {
        const fetched = res.data.data;
        setProjects(fetched);

        // Validate saved project ID strictly against authorized projects returned by backend
        const savedId = preferredId || localStorage.getItem(STORAGE_KEY);
        const matchedSaved = savedId ? fetched.find(p => String(p._id) === String(savedId)) : null;

        if (matchedSaved) {
          const validId = String(matchedSaved._id);
          setSelectedProjectIdState(validId);
          localStorage.setItem(STORAGE_KEY, validId);
        } else if (fetched.length > 0) {
          const defaultProj =
            fetched.find(p => p.status === 'ACTIVE' && p.isDefault) ||
            fetched.find(p => p.status === 'ACTIVE') ||
            fetched[0];
          const newId = String(defaultProj._id);
          setSelectedProjectIdState(newId);
          localStorage.setItem(STORAGE_KEY, newId);
        } else {
          setSelectedProjectIdState('');
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (err) {
      console.error('[ProjectContext] Failed to load projects:', err);
      setProjectsError(err.response?.data?.message || err.message);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // Sync projects when user session changes; clear stale state on logout
  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
      setSelectedProjectIdState('');
      unsavedFormsRef.current.clear();
      setUnsavedFormsCount(0);
      setLoadingProjects(false);
    }
  }, [user, fetchProjects]);

  // Switch active project safely with unsaved-form protection and authorization check
  const switchProject = useCallback((id, options = {}) => {
    if (!id) return false;
    const strId = String(id);
    if (strId === String(selectedProjectId)) return true;

    if (projects.length > 0 && !options.allowUnlisted) {
      const authorized = projects.some(p => String(p._id) === strId);
      if (!authorized) {
        console.warn('[ProjectContext] Blocked switch to unauthorized or unlisted project:', strId);
        return false;
      }
    }

    if (unsavedFormsRef.current.size > 0 && !options.skipConfirm) {
      const labels = Array.from(unsavedFormsRef.current.values()).join(', ');
      const targetProj = projects.find(p => String(p._id) === strId);
      const targetName = targetProj?.name || 'another project';
      const confirmed = window.confirm(
        `You have an open form (${labels}) under the current project.\n\nSwitching to "${targetName}" will close/discard unsaved changes so records are not submitted under the wrong project.\n\nContinue switching projects?`
      );
      if (!confirmed) {
        return false;
      }
      unsavedFormsRef.current.clear();
      setUnsavedFormsCount(0);
    }

    setSelectedProjectIdState(strId);
    localStorage.setItem(STORAGE_KEY, strId);
    setProjectSwitchVersion(v => v + 1);
    return true;
  }, [projects, selectedProjectId]);

  // Backwards-compatible alias
  const setSelectedProjectId = switchProject;

  // Computed selected project object (strictly matched against authorized projects)
  const selectedProject =
    projects.find(p => String(p._id) === String(selectedProjectId)) ||
    (selectedProjectId ? null : projects[0] || null);

  // Actions
  const createProject = async (projectData) => {
    const res = await api.post('/projects', projectData);
    if (res.data?.success) {
      const created = res.data.data;
      await fetchProjects(created._id);
      setProjectSwitchVersion(v => v + 1);
      return created;
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
      const nextPreferred = String(selectedProjectId) === String(id) ? null : selectedProjectId;
      await fetchProjects(nextPreferred);
      if (String(selectedProjectId) === String(id)) {
        setProjectSwitchVersion(v => v + 1);
      }
      return true;
    }
    throw new Error(res.data?.message || 'Failed to archive project');
  };

  const assignUsers = async (id, assignedUsers, restrictAccess) => {
    const payload = { assignedUsers };
    if (restrictAccess !== undefined) {
      payload.restrictAccess = Boolean(restrictAccess);
    }
    const res = await api.post(`/projects/${id}/assign`, payload);
    if (res.data?.success) {
      await fetchProjects(selectedProjectId);
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Failed to assign project users');
  };

  const value = {
    projects,
    selectedProject,
    selectedProjectId: selectedProject ? String(selectedProject._id) : selectedProjectId,
    setSelectedProjectId,
    switchProject,
    projectSwitchVersion,
    hasUnsavedForms: unsavedFormsCount > 0,
    registerUnsavedForm,
    unregisterUnsavedForm,
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
