'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DocumentTextIcon, LockClosedIcon } from '@heroicons/react/24/outline';

export default function ProposalAccessPage() {
  const router = useRouter();
  const params = useParams();
  const proposalId = params.id as string;

  const [formData, setFormData] = useState({
    proposalNumber: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [proposalInfo, setProposalInfo] = useState<{
    name?: string;
    clientName?: string;
  } | null>(null);

  // Check if already authenticated
  useEffect(() => {
    const token = localStorage.getItem('client_token');
    if (token) {
      // User is already authenticated, redirect to proposal
      router.push(`/proposal/${proposalId}`);
    }
  }, [proposalId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.proposalNumber || !formData.password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/v1/client/login/proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposalNumber: formData.proposalNumber,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store client session
        localStorage.setItem('client_token', data.data.token);
        localStorage.setItem('proposal_id', data.data.proposalId);

        // Redirect to the specific proposal
        router.push(`/proposal/${proposalId}`);
        toast.success('Acesso autorizado!');
      } else {
        toast.error(data.message || 'Credenciais inválidas');
      }
    } catch (error) {
      console.error('Proposal access error:', error);
      toast.error('Erro ao acessar proposta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg">
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Acesso à Proposta
          </h1>
          <p className="mt-2 text-gray-600">
            Entre com suas credenciais para visualizar a proposta
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="proposalNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Número de Acesso da Proposta
              </label>
              <div className="relative">
                <input
                  id="proposalNumber"
                  name="proposalNumber"
                  type="text"
                  required
                  autoComplete="off"
                  value={formData.proposalNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, proposalNumber: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-lg text-center"
                  placeholder="123456"
                  maxLength={6}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Código de 6 dígitos fornecido junto com a proposta
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha de Acesso
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite sua senha de acesso"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verificando credenciais...
                </div>
              ) : (
                'Acessar Proposta'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500">
                🔒 Acesso seguro e protegido
              </p>
              <p className="text-xs text-gray-400 mt-1">
                As credenciais foram fornecidas pelo criador da proposta
              </p>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Não consegue acessar? Entre em contato com quem enviou a proposta.
          </p>
        </div>
      </div>
    </div>
  );
}