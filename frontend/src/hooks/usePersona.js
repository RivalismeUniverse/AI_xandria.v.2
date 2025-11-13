import { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const usePersona = (personaId = null) => {
  const [persona, setPersona] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (personaId) {
      fetchPersona(personaId);
    }
  }, [personaId]);

  const fetchPersona = async (id) => {
    setLoading(true);
    try {
      const data = await api.getPersona(id);
      setPersona(data);
      return data;
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load persona');
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonas = async (params = {}) => {
    setLoading(true);
    try {
      const data = await api.getPersonas(params);
      setPersonas(data.personas);
      return data;
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load personas');
    } finally {
      setLoading(false);
    }
  };

  const createPersona = async (data) => {
    setLoading(true);
    try {
      const newPersona = await api.createPersona(data);
      toast.success(`${newPersona.name} created!`);
      return newPersona;
    } catch (err) {
      setError(err.message);
      toast.error('Failed to create persona');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePersona = async (id, data) => {
    setLoading(true);
    try {
      const updated = await api.updatePersona(id, data);
      setPersona(updated);
      toast.success('Persona updated!');
      return updated;
    } catch (err) {
      setError(err.message);
      toast.error('Failed to update persona');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePersona = async (id) => {
    setLoading(true);
    try {
      await api.deletePersona(id);
      toast.success('Persona deleted');
      return true;
    } catch (err) {
      setError(err.message);
      toast.error('Failed to delete persona');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    persona,
    personas,
    loading,
    error,
    fetchPersona,
    fetchPersonas,
    createPersona,
    updatePersona,
    deletePersona
  };
};
