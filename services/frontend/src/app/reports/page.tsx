'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

// Helper function to build monthly statistics from proposals data
const buildMonthlyStats = (proposals: any[]) => {
  const monthlyData: { [key: string]: {
    proposals: number;
    closedDeals: number;
    revenue: number;
    month: string;
    sortKey: string;
  } } = {};

  proposals.forEach(proposal => {
    // Track sent proposals by creation date
    if (proposal.created_at) {
      const createdDate = new Date(proposal.created_at);
      const createdMonthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
      const createdMonthName = createdDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

      if (!monthlyData[createdMonthKey]) {
        monthlyData[createdMonthKey] = {
          month: createdMonthName.charAt(0).toUpperCase() + createdMonthName.slice(1),
          proposals: 0,
          closedDeals: 0,
          revenue: 0,
          sortKey: createdMonthKey
        };
      }

      monthlyData[createdMonthKey].proposals += 1;
    }

    // Track closed deals by closing date
    if (proposal.status === 'closed' && proposal.closed_at) {
      const closedDate = new Date(proposal.closed_at);
      const closedMonthKey = `${closedDate.getFullYear()}-${String(closedDate.getMonth() + 1).padStart(2, '0')}`;
      const closedMonthName = closedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

      if (!monthlyData[closedMonthKey]) {
        monthlyData[closedMonthKey] = {
          month: closedMonthName.charAt(0).toUpperCase() + closedMonthName.slice(1),
          proposals: 0,
          closedDeals: 0,
          revenue: 0,
          sortKey: closedMonthKey
        };
      }

      monthlyData[closedMonthKey].closedDeals += 1;
      monthlyData[closedMonthKey].revenue += parseFloat(proposal.proposal_value) || 0;
    }
  });

  // Convert to array and sort by date (most recent first)
  const sortedData = Object.keys(monthlyData)
    .sort((a, b) => b.localeCompare(a))
    .map(key => monthlyData[key])
    .slice(0, 12); // Show last 12 months

  // Add month-over-month comparisons
  return sortedData.map((current, index) => {
    const previous = sortedData[index + 1];

    const closedDealsChange = previous ?
      (current.closedDeals - previous.closedDeals) : 0;

    let closedDealsChangePercent = 0;
    if (previous) {
      if (previous.closedDeals === 0 && current.closedDeals > 0) {
        // When previous was 0 and current is positive, show 100% growth
        closedDealsChangePercent = 100;
      } else if (previous.closedDeals > 0) {
        // Normal percentage calculation
        closedDealsChangePercent = ((current.closedDeals - previous.closedDeals) / previous.closedDeals) * 100;
      }
      // If both are 0, keep as 0
    }

    const proposalsChange = previous ?
      (current.proposals - previous.proposals) : 0;

    let proposalsChangePercent = 0;
    if (previous) {
      if (previous.proposals === 0 && current.proposals > 0) {
        // When previous was 0 and current is positive, show 100% growth
        proposalsChangePercent = 100;
      } else if (previous.proposals > 0) {
        // Normal percentage calculation
        proposalsChangePercent = ((current.proposals - previous.proposals) / previous.proposals) * 100;
      }
      // If both are 0, keep as 0
    }

    return {
      ...current,
      closedDealsChange,
      closedDealsChangePercent,
      proposalsChange,
      proposalsChangePercent
    };
  });
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState({
    totalClients: 0,
    totalProposals: 0,
    totalRevenue: 0,
    conversionRate: 0,
    monthlyStats: []
  });
  const { tokens } = useAuthStore();

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check auth using the same system as dashboard
        if (!tokens?.accessToken) {
          return;
        }

        // Load real dashboard stats (same as dashboard page)
        const statsResponse = await fetch('/api/v1/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
          },
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          const stats = statsData.data.stats;

          // Since API doesn't provide clients or monthlyStats, we need to fetch them separately
          let clientsCount = 0;
          let monthlyStats = [];

          // Try to fetch clients count from clients API
          try {
            const clientsResponse = await fetch('/api/v1/clients', {
              headers: {
                'Authorization': `Bearer ${tokens.accessToken}`,
              },
            });
            if (clientsResponse.ok) {
              const clientsData = await clientsResponse.json();
              clientsCount = clientsData.data?.clients?.length || 0;
            }
          } catch (clientsError) {
            console.warn('Could not fetch clients count:', clientsError);
          }

          // Fetch proposals to build monthly statistics
          try {
            const proposalsResponse = await fetch('/api/v1/proposals', {
              headers: {
                'Authorization': `Bearer ${tokens.accessToken}`,
              },
            });
            if (proposalsResponse.ok) {
              const proposalsData = await proposalsResponse.json();
              const proposals = proposalsData.data?.proposals || [];

              console.log('Proposals for monthly stats:', proposals);

              // Build monthly statistics from proposals
              monthlyStats = buildMonthlyStats(proposals);
              console.log('Built monthly stats:', monthlyStats);
              console.log('First month data:', monthlyStats[0]);
              console.log('Second month data:', monthlyStats[1]);
            }
          } catch (proposalsError) {
            console.warn('Could not fetch proposals for monthly stats:', proposalsError);
          }

          setReports({
            totalClients: clientsCount,
            totalProposals: stats.proposals?.total || 0,
            totalRevenue: stats.revenue?.total || 0,
            conversionRate: stats.activity?.conversionRate || 0,
            monthlyStats: monthlyStats
          });
        } else {
          const errorMsg = 'Falha ao carregar dados dos relatórios';
          console.error(errorMsg);
          setError(errorMsg);
          // Set default values if API fails
          setReports({
            totalClients: 0,
            totalProposals: 0,
            totalRevenue: 0,
            conversionRate: 0,
            monthlyStats: []
          });
        }
      } catch (error) {
        const errorMsg = 'Erro ao carregar relatórios. Verifique sua conexão.';
        console.error('Error loading reports:', error);
        setError(errorMsg);
        // Set default values if API fails
        setReports({
          totalClients: 0,
          totalProposals: 0,
          totalRevenue: 0,
          conversionRate: 0,
          monthlyStats: []
        });
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, [tokens]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Visualize o desempenho do seu negócio</p>
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{reports.totalClients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Propostas</p>
                <p className="text-2xl font-bold text-gray-900">{reports.totalProposals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Todas Propostas</p>
                <p className="text-2xl font-bold text-gray-900">R$ {reports.totalRevenue.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-gray-900">{reports.conversionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Stats */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Estatísticas Mensais</h2>
            <p className="text-sm text-gray-500 mt-1">Dados históricos mensais de propostas e receita</p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mês
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Propostas Enviadas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      vs Mês Anterior
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Negócios Fechados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      vs Mês Anterior
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receita
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.monthlyStats.length > 0 ? (
                    reports.monthlyStats.map((stat: any, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {stat.month || `Mês ${index + 1}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stat.proposals || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {stat.proposalsChange !== undefined ? (
                            <div className="flex items-center">
                              {stat.proposalsChange > 0 ? (
                                <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 6.414 6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : stat.proposalsChange < 0 ? (
                                <svg className="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 13.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <span className="w-4 h-4 mr-1 text-gray-400">—</span>
                              )}
                              <span className={`${stat.proposalsChange > 0 ? 'text-green-600' : stat.proposalsChange < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                {stat.proposalsChange > 0 ? '+' : ''}{stat.proposalsChange}
                                {(stat.proposalsChangePercent !== 0 || stat.proposalsChange !== 0) && (
                                  <span className="ml-1">
                                    ({stat.proposalsChangePercent > 0 ? '+' : ''}{stat.proposalsChangePercent.toFixed(1)}%)
                                  </span>
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stat.closedDeals || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {stat.closedDealsChange !== undefined ? (
                            <div className="flex items-center">
                              {stat.closedDealsChange > 0 ? (
                                <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 6.414 6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : stat.closedDealsChange < 0 ? (
                                <svg className="w-4 h-4 text-red-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 13.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <span className="w-4 h-4 mr-1 text-gray-400">—</span>
                              )}
                              <span className={`${stat.closedDealsChange > 0 ? 'text-green-600' : stat.closedDealsChange < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                {stat.closedDealsChange > 0 ? '+' : ''}{stat.closedDealsChange}
                                {(stat.closedDealsChangePercent !== 0 || stat.closedDealsChange !== 0) && (
                                  <span className="ml-1">
                                    ({stat.closedDealsChangePercent > 0 ? '+' : ''}{stat.closedDealsChangePercent.toFixed(1)}%)
                                  </span>
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          R$ {(stat.revenue || 0).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center">
                        <div className="text-gray-400">
                          <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p className="text-sm text-gray-500">
                            Nenhum dado mensal disponível ainda
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}