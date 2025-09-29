'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api';
import { apiEndpoints } from '@/config';
import {
  PlusIcon,
  XMarkIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  DocumentPlusIcon,
} from '@heroicons/react/24/outline';

// Client form validation schema
const clientSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido')
    .max(254, 'E-mail muito longo'),
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Formato: (11) 99999-9999'),
  company: z
    .string()
    .max(100, 'Nome da empresa muito longo')
    .optional()
    .or(z.literal('')),
  position: z
    .string()
    .max(100, 'Cargo muito longo')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .max(100, 'Localização muito longa')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .max(2000, 'Notas muito longas')
    .optional()
    .or(z.literal('')),
});

type ClientFormData = z.infer<typeof clientSchema>;

// Phone number formatting function
const formatPhoneNumber = (value: string) => {
  // Remove all non-numeric characters
  const numericValue = value.replace(/\D/g, '');

  // Limit to 11 digits maximum
  const limitedValue = numericValue.slice(0, 11);

  // Apply formatting based on length
  if (limitedValue.length <= 2) {
    return `(${limitedValue}`;
  } else if (limitedValue.length <= 7) {
    return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2)}`;
  } else {
    return `(${limitedValue.slice(0, 2)}) ${limitedValue.slice(2, 7)}-${limitedValue.slice(7, 11)}`;
  }
};

export default function SimpleClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [phoneValue, setPhoneValue] = useState('');
  const router = useRouter();
  const { isAuthenticated, tokens, logout } = useAuthStore();

  // Form handling
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      location: '',
      notes: '',
    },
  });

  // Handle phone input change with formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneValue(formatted);
    setValue('phone', formatted, { shouldValidate: true });
  };

  // Reset form and phone value
  const resetForm = () => {
    reset();
    setPhoneValue('');
  };

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated || !tokens) {
      router.push('/auth/login');
      return;
    }

    // Load clients
    const loadClients = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get('/clients');

        if (response.data.success && response.data.data.clients) {
          setClients(response.data.data.clients);
        } else {
          setClients([]);
        }
      } catch (error: any) {
        console.error('Error loading clients:', error);

        if (error.response?.status === 401 || error.response?.status === 403) {
          // Auth failed, logout and redirect
          logout();
          router.push('/auth/login');
          return;
        }

        setError('Failed to load clients. Please try again.');
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [isAuthenticated, tokens, router, logout]);

  // Handle edit client
  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setPhoneValue(client.phone || '');
    reset({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      position: client.position || '',
      location: client.location || '',
      notes: client.notes || '',
    });
    setShowEditModal(true);
  };

  // Handle delete client
  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${clientName}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/clients/${clientId}`);
      toast.success('Cliente excluído com sucesso!');
      setClients(prev => prev.filter(client => client.id !== clientId));
    } catch (error: any) {
      console.error('Error deleting client:', error);
      toast.error('Erro ao excluir cliente. Tente novamente.');
    }
  };

  // Handle create proposal for client
  const handleCreateProposal = (client: any) => {
    // Navigate to proposal creation page with client info as query parameters
    const queryParams = new URLSearchParams({
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientCompany: client.company || '',
    });

    router.push(`/proposals/create?${queryParams.toString()}`);
  };

  // Handle adding new client
  const onSubmit = async (data: ClientFormData) => {
    try {
      const clientData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        ...(data.company && { company: data.company }),
        ...(data.position && { position: data.position }),
        ...(data.location && { location: data.location }),
        ...(data.notes && { notes: data.notes }),
      };

      console.log('Sending client data:', clientData);

      let response;
      if (editingClient) {
        // Update existing client
        response = await apiClient.put(`/clients/${editingClient.id}`, clientData);
      } else {
        // Create new client
        response = await apiClient.post('/clients', clientData);
      }

      console.log('API Response:', response.data);

      if (response.data.success) {
        if (editingClient) {
          toast.success('Cliente atualizado com sucesso!');
          setShowEditModal(false);
          setEditingClient(null);
          // Update client in the list
          setClients(prev => prev.map(client =>
            client.id === editingClient.id
              ? (response.data.data.client || response.data.data)
              : client
          ));
        } else {
          toast.success('Cliente adicionado com sucesso!');
          setShowAddModal(false);
          // Add new client to the list without full reload for better UX
          setClients(prev => [response.data.data.client || response.data.data, ...prev]);
        }
        resetForm();
      } else {
        toast.error(response.data.message || `Erro ao ${editingClient ? 'atualizar' : 'adicionar'} cliente`);
      }
    } catch (error: any) {
      console.error('Error adding client:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      let errorMessage = 'Erro ao adicionar cliente. Tente novamente.';

      if (error.response?.data) {
        const { message, errors } = error.response.data;

        if (errors && Array.isArray(errors)) {
          // Format validation errors from API
          errorMessage = errors.map((err: any) => err.message).join(', ');
        } else if (message) {
          errorMessage = message;
        }
      }

      toast.error(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary-600">Loading clients...</p>
          <p className="text-xs text-secondary-400 mt-2">If this takes too long, please refresh the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
              <p className="text-gray-600">Gerencie seus clientes</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center text-sm font-medium transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Adicionar Cliente
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {clients.length === 0 ? (
            <div className="p-12 text-center">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum cliente ainda</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece adicionando seu primeiro cliente.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Cliente
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {clients.map((client) => (
                <div key={client.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {client.name}
                      </h3>
                      <p className="text-gray-600">{client.email}</p>
                      <p className="text-gray-500">{client.company}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        client.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.status}
                      </span>
                      <button
                        onClick={() => handleCreateProposal(client)}
                        className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 border border-green-200 rounded-md transition-colors flex items-center"
                        title="Criar proposta para este cliente"
                      >
                        <DocumentPlusIcon className="h-4 w-4 mr-1" />
                        Nova Proposta
                      </button>
                      <button
                        onClick={() => handleEditClient(client)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
                        title="Editar cliente"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClient(client.id, client.name)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        title="Excluir cliente"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Client Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Adicionar Cliente</h3>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <input
                      {...register('name')}
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nome completo do cliente"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail *
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="cliente@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="text"
                      value={phoneValue}
                      onChange={handlePhoneChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Company */}
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa
                    </label>
                    <input
                      {...register('company')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nome da empresa"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo
                    </label>
                    <input
                      {...register('position')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Cargo do cliente"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                      Localização
                    </label>
                    <input
                      {...register('location')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Cidade, Estado"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Observações
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Observações sobre o cliente..."
                    />
                    {errors.notes && (
                      <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Salvando...
                        </div>
                      ) : (
                        'Adicionar Cliente'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Client Modal */}
        {showEditModal && editingClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Editar Cliente</h3>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingClient(null);
                      resetForm();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome *
                    </label>
                    <input
                      {...register('name')}
                      type="text"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nome completo do cliente"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail *
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="cliente@email.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="text"
                      value={phoneValue}
                      onChange={handlePhoneChange}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="(11) 99999-9999"
                      maxLength={15}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  {/* Company */}
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa
                    </label>
                    <input
                      {...register('company')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nome da empresa"
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo
                    </label>
                    <input
                      {...register('position')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Cargo do cliente"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                      Localização
                    </label>
                    <input
                      {...register('location')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Cidade, Estado"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                      Observações
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Observações sobre o cliente..."
                    />
                    {errors.notes && (
                      <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingClient(null);
                        resetForm();
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Salvando...
                        </div>
                      ) : (
                        'Atualizar Cliente'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}