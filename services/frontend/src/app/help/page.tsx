// ============================================================================
// Help Page - User Documentation and Support
// AURELIA Agent - Design System and UI Specialist
// ============================================================================

'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import {
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

const helpSections = [
  {
    title: 'Primeiros Passos',
    icon: BookOpenIcon,
    description: 'Aprenda o básico para começar a usar a plataforma',
    articles: [
      { title: 'Como criar minha primeira proposta', href: '#criar-proposta' },
      { title: 'Gerenciando clientes', href: '#gerenciar-clientes' },
      { title: 'Entendendo os status das propostas', href: '#status-propostas' },
      { title: 'Configurações da conta', href: '#configuracoes' },
    ],
  },
  {
    title: 'Propostas',
    icon: DocumentTextIcon,
    description: 'Tudo sobre criação e gestão de propostas',
    articles: [
      { title: 'Criando propostas personalizadas', href: '#propostas-personalizadas' },
      { title: 'Editando e versionando propostas', href: '#editar-propostas' },
      { title: 'Enviando propostas para clientes', href: '#enviar-propostas' },
      { title: 'Acompanhando interações dos clientes', href: '#acompanhar-interacoes' },
    ],
  },
  {
    title: 'Clientes',
    icon: UserGroupIcon,
    description: 'Gestão de relacionamento com clientes',
    articles: [
      { title: 'Adicionando novos clientes', href: '#adicionar-clientes' },
      { title: 'Organizando informações de clientes', href: '#organizar-clientes' },
      { title: 'Histórico de propostas por cliente', href: '#historico-cliente' },
      { title: 'Importando lista de clientes', href: '#importar-clientes' },
    ],
  },
  {
    title: 'Relatórios e Análises',
    icon: ChatBubbleLeftRightIcon,
    description: 'Análise de desempenho e métricas',
    articles: [
      { title: 'Dashboard e indicadores', href: '#dashboard' },
      { title: 'Relatórios mensais', href: '#relatorios-mensais' },
      { title: 'Taxa de conversão', href: '#taxa-conversao' },
      { title: 'Exportando dados', href: '#exportar-dados' },
    ],
  },
  {
    title: 'Vídeo Tutoriais',
    icon: VideoCameraIcon,
    description: 'Aprenda visualmente com nossos tutoriais',
    articles: [
      { title: 'Tour completo da plataforma (5 min)', href: '#video-tour' },
      { title: 'Criando sua primeira proposta (3 min)', href: '#video-primeira-proposta' },
      { title: 'Melhores práticas (7 min)', href: '#video-boas-praticas' },
      { title: 'Dicas avançadas (10 min)', href: '#video-avancado' },
    ],
  },
];

const faqItems = [
  {
    question: 'Como faço para enviar uma proposta para um cliente?',
    answer: 'Após criar e revisar sua proposta, clique no botão "Enviar para Cliente". O cliente receberá um link por e-mail para visualizar e interagir com a proposta.',
  },
  {
    question: 'Posso editar uma proposta depois de enviá-la?',
    answer: 'Sim! Você pode editar propostas a qualquer momento. Se o cliente solicitar alterações, você pode fazer as modificações necessárias e o cliente será notificado automaticamente.',
  },
  {
    question: 'Como sei quando um cliente visualizou minha proposta?',
    answer: 'Você receberá notificações em tempo real quando um cliente abrir, comentar ou tomar qualquer ação em relação à sua proposta. Todas as atividades ficam registradas no histórico.',
  },
  {
    question: 'Qual é o limite de propostas que posso criar?',
    answer: 'Não há limite! Você pode criar quantas propostas precisar. O sistema foi projetado para escalar conforme seu negócio cresce.',
  },
  {
    question: 'Como funciona o sistema de comentários?',
    answer: 'Clientes podem adicionar comentários em seções específicas da proposta. Você receberá notificações e poderá responder diretamente na plataforma, mantendo toda a comunicação organizada.',
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-secondary-600 hover:text-secondary-900 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
              <QuestionMarkCircleIcon className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">
            Central de Ajuda
          </h1>
          <p className="text-lg text-secondary-600">
            Encontre respostas, tutoriais e guias para aproveitar ao máximo a plataforma
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <input
              type="search"
              placeholder="Buscar artigos, tutoriais, perguntas..."
              className="input-field w-full pl-4 pr-4 py-3 text-lg"
            />
          </div>
        </div>

        {/* Help Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {helpSections.map((section) => (
            <div key={section.title} className="glass-card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <section.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h2 className="text-lg font-semibold text-secondary-900">
                  {section.title}
                </h2>
              </div>
              <p className="text-sm text-secondary-600 mb-4">
                {section.description}
              </p>
              <ul className="space-y-2">
                {section.articles.map((article) => (
                  <li key={article.title}>
                    <a
                      href={article.href}
                      className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      {article.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold text-secondary-900 mb-6">
            Perguntas Frequentes
          </h2>
          <div className="space-y-6">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-secondary-200 pb-6 last:border-0 last:pb-0">
                <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                  {item.question}
                </h3>
                <p className="text-secondary-600">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="glass-card p-8 text-center">
          <h2 className="text-xl font-bold text-secondary-900 mb-2">
            Ainda precisa de ajuda?
          </h2>
          <p className="text-secondary-600 mb-6">
            Nossa equipe de suporte está pronta para ajudar você
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:suporte@infigital.net"
              className="btn-primary"
            >
              Enviar E-mail
            </a>
            <a
              href="https://wa.me/5548999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
