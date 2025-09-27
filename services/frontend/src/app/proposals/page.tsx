'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  ClockIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  LockClosedIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth';

interface Proposal {
  id: string;
  proposal_name: string;
  client_name: string;
  job_name: string;
  status: 'open' | 'closed' | 'archived';
  proposal_value: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  public_token: string;
  client_username: string;
  client_password_display: string;
}

const getStatusBadge = (status: string) => {
  const styles = {
    open: 'bg-blue-100 text-blue-800 border-blue-200',
    closed: 'bg-green-100 text-green-800 border-green-200',
    archived: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const labels = {
    open: 'Aberta',
    closed: 'Fechada',
    archived: 'Arquivada'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'open':
      return <ClockIcon className="h-4 w-4 text-blue-500" />;
    case 'closed':
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    case 'archived':
      return <ArchiveBoxIcon className="h-4 w-4 text-gray-500" />;
    default:
      return <DocumentTextIcon className="h-4 w-4 text-gray-500" />;
  }
};

export default function ProposalsPage() {
  const { user, tokens } = useAuthStore();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  // Load proposals
  const loadProposals = async () => {
    if (!tokens?.accessToken) return;

    try {
      setLoading(true);

      const response = await fetch('/api/v1/proposals', {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProposals(data.data.proposals);
      } else {
        toast.error('Erro ao carregar propostas');
      }
    } catch (error) {
      console.error('Error loading proposals:', error);
      toast.error('Erro ao carregar propostas');
    } finally {
      setLoading(false);
    }
  };

  // Delete proposal
  const deleteProposal = async (proposalId: string) => {
    if (!tokens?.accessToken) return;

    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta proposta? Esta ação não pode ser desfeita.'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/v1/proposals/${proposalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.ok) {
        setProposals(prev => prev.filter(p => p.id !== proposalId));
        toast.success('Proposta excluída com sucesso');
      } else {
        toast.error('Erro ao excluir proposta');
      }
    } catch (error) {
      console.error('Error deleting proposal:', error);
      toast.error('Erro ao excluir proposta');
    }
  };

  // Copy proposal link
  const copyProposalLink = async (publicToken: string) => {
    if (!publicToken) {
      toast.error('Token público não disponível');
      return;
    }

    const url = `${window.location.origin}/proposal/${publicToken}`;

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copiado para a área de transferência');
    } catch (error) {
      console.error('Error copying link:', error);
      toast.error('Erro ao copiar link');
    }
  };

  // Show credentials modal
  const showCredentials = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setShowCredentialsModal(true);
  };

  // Copy credentials to clipboard
  const copyCredentials = async (username: string, password: string) => {
    const credentials = `Usuário: ${username}\nSenha: ${password}`;
    try {
      await navigator.clipboard.writeText(credentials);
      toast.success('Credenciais copiadas para a área de transferência');
    } catch (error) {
      console.error('Error copying credentials:', error);
      toast.error('Erro ao copiar credenciais');
    }
  };

  // Filter proposals based on search and status
  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = searchTerm === '' ||
      proposal.proposal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.client_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    if (tokens?.accessToken) {
      loadProposals();
    }
  }, [tokens]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando propostas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Propostas</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gerencie todas as suas propostas comerciais
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/proposals/create"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center text-sm font-medium transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Nova Proposta
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Buscar propostas
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome da proposta ou cliente..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos os status</option>
                <option value="open">Abertas</option>
                <option value="closed">Fechadas</option>
                <option value="archived">Arquivadas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Proposals Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Suas Propostas</h2>
              <span className="text-sm text-gray-500">
                {filteredProposals.length} de {proposals.length} proposta(s)
              </span>
            </div>
          </div>

          {filteredProposals.length === 0 ? (
            <div className="p-12 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              {proposals.length === 0 ? (
                <>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma proposta ainda</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Comece criando sua primeira proposta.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/proposals/create"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Criar Primeira Proposta
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma proposta encontrada</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Tente ajustar os filtros de busca ou status.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proposta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProposals.map((proposal) => (
                    <tr key={proposal.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(proposal.status)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {proposal.proposal_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {proposal.job_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{proposal.client_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {proposal.proposal_value > 0 ? (
                            new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(proposal.proposal_value)
                          ) : (
                            '-'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(proposal.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {proposal.public_token && (
                            <button
                              onClick={() => copyProposalLink(proposal.public_token)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Copiar link"
                            >
                              <ShareIcon className="h-4 w-4" />
                            </button>
                          )}

                          <button
                            onClick={() => showCredentials(proposal)}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Ver credenciais do cliente"
                          >
                            <LockClosedIcon className="h-4 w-4" />
                          </button>

                          <Link
                            href={`/proposals/${proposal.id}/edit`}
                            className="text-gray-600 hover:text-gray-900 transition-colors"
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>

                          <button
                            onClick={() => deleteProposal(proposal.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Excluir"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/proposals/create"
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PlusIcon className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Criar Proposta</h3>
                <p className="text-sm text-gray-600">
                  Comece uma nova proposta do zero
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Dashboard</h3>
                <p className="text-sm text-gray-600">
                  Visualize estatísticas e métricas
                </p>
              </div>
            </div>
          </Link>

          <div className="bg-white rounded-lg shadow-sm border p-6 group">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Templates</h3>
                <p className="text-sm text-gray-600">
                  Modelos de propostas (em breve)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credentials Modal */}
      {showCredentialsModal && selectedProposal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <LockClosedIcon className="h-5 w-5 mr-2 text-green-600" />
                Credenciais de Acesso do Cliente
              </h3>
              <button
                onClick={() => setShowCredentialsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Proposta: {selectedProposal.proposal_name}
                </h4>
                <p className="text-sm text-gray-600">
                  Cliente: {selectedProposal.client_name}
                </p>
              </div>

              <div className="bg-gray-50 rounded-md p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuário de Acesso
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={selectedProposal.client_username}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedProposal.client_username)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                    >
                      Copiar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha de Acesso
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={selectedProposal.client_password_display || 'Não disponível'}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedProposal.client_password_display || '')}
                      className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                      disabled={!selectedProposal.client_password_display}
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => copyCredentials(selectedProposal.client_username, selectedProposal.client_password_display || '')}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 flex items-center"
                >
                  <ClipboardDocumentCheckIcon className="h-4 w-4 mr-2" />
                  Copiar Ambos
                </button>

                <button
                  onClick={() => setShowCredentialsModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300"
                >
                  Fechar
                </button>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-800">
                  <strong>Nota:</strong> Compartilhe essas credenciais com o cliente para que ele possa acessar a proposta.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}