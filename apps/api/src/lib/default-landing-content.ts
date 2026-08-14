/**
 * Baseline do CMS — espelha o fallback local da ambiental-landing.
 * Usado ao criar o primeiro LandingSite da organização.
 */
export function getDefaultLandingContent() {
  const portalUrl =
    process.env.LANDING_PORTAL_URL ??
    "https://portal.ambientalconsultoria.com.br";

  const sectionKeys = [
    "hero",
    "provaSocial",
    "pilares",
    "solucoes",
    "portalCliente",
    "segmentos",
    "diferenciais",
    "depoimentos",
    "abrangencia",
    "comoFunciona",
    "faq",
    "ctaFinal",
  ] as const;

  const navItems = [
    { label: "Soluções", href: "#solucoes" },
    { label: "Portal", href: "#portal-cliente" },
    { label: "Segmentos", href: "#segmentos" },
    { label: "Depoimentos", href: "#depoimentos" },
    { label: "FAQ", href: "#faq" },
    { label: "Contato", href: "#contato" },
  ];

  return {
    meta: {
      source: "mixed" as const,
      updatedAt: new Date().toISOString(),
    },
    layout: {
      sections: sectionKeys.map((key, index) => ({
        key,
        visible: true,
        order: index + 1,
      })),
    },
    header: {
      brandName: "Ambiental Consultoria",
      navItems,
      primaryCta: {
        label: "Falar com um consultor",
        href: "#contato",
        variant: "primary" as const,
      },
      portalCta: {
        label: "Acessar portal do cliente",
        href: portalUrl,
        variant: "tech" as const,
      },
      portalUrl,
    },
    footer: {
      brandName: "Ambiental Consultoria",
      tagline:
        "Ambiental Consultoria e Serviços Ambientais e Segurança do Trabalho",
      legalLine: "CNPJ: 00.000.000/0001-00 (a confirmar) · Endereço a confirmar",
      navItems,
      socialLinks: [
        {
          label: "LinkedIn",
          href: "#",
          ariaLabel: "LinkedIn da Ambiental Consultoria",
        },
        {
          label: "Instagram",
          href: "#",
          ariaLabel: "Instagram da Ambiental Consultoria",
        },
      ],
      privacyHref: "/politica-de-privacidade",
      privacyLabel: "Política de privacidade (LGPD)",
    },
    hero: {
      eyebrow: "Consultoria Ambiental & Segurança do Trabalho",
      headline:
        "Sua empresa em conformidade — com dados em tempo real, não em PDF anual.",
      subheadline:
        "Consultoria técnica em meio ambiente e segurança do trabalho, com portal próprio para acompanhar licenciamento, laudos e indicadores sem depender de planilha ou visita surpresa do fiscal.",
      ctas: [
        {
          label: "Falar com um consultor",
          href: "#contato",
          variant: "primary" as const,
        },
        {
          label: "Ver o portal do cliente",
          href: "#portal-cliente",
          variant: "outline" as const,
        },
      ],
      trustMetrics: [
        {
          id: "empresas-atendidas",
          valor: 120,
          sufixo: "+",
          label: "empresas atendidas",
          isPlaceholder: true,
        },
        {
          id: "anos-atuacao",
          valor: 12,
          sufixo: "+",
          label: "anos de atuação",
          isPlaceholder: true,
        },
      ],
      media: { kind: "none" as const, motion: "none" as const },
    },
    provaSocial: {
      metrics: [
        {
          id: "empresas-atendidas",
          valor: 120,
          sufixo: "+",
          label: "empresas atendidas",
          isPlaceholder: true,
        },
        {
          id: "laudos-emitidos",
          valor: 800,
          sufixo: "+",
          label: "laudos e documentos técnicos emitidos",
          isPlaceholder: true,
        },
        {
          id: "anos-atuacao",
          valor: 12,
          sufixo: "+",
          label: "anos de atuação",
          isPlaceholder: true,
        },
        {
          id: "indicadores-monitorados",
          valor: 50,
          sufixo: "+",
          label: "indicadores monitorados em tempo real",
          isPlaceholder: true,
        },
      ],
      logosEyebrow: "Confiado por empresas de diferentes setores",
      logos: Array.from({ length: 6 }, (_, i) => ({
        id: `logo-placeholder-${i + 1}`,
        nome: "Logo do cliente",
        isPlaceholder: true,
      })),
    },
    pilares: {
      eyebrow: "Como atuamos",
      title: "Dois pilares, uma só operação",
      items: [
        {
          id: "ambiental",
          tone: "primary" as const,
          iconKey: "Recycle",
          titulo: "Consultoria Ambiental",
          descricao:
            "Regularização, laudos e gestão de resíduos conduzidos por equipe técnica especializada.",
          bullets: [
            "Licenciamento ambiental (municipal, estadual e federal)",
            "Laudos técnicos e estudos ambientais",
            "Plano de Gerenciamento de Resíduos Sólidos (PGRS)",
            "Acompanhamento contínuo de conformidade",
          ],
          href: "#solucoes",
        },
        {
          id: "sst",
          tone: "accent" as const,
          iconKey: "HardHat",
          titulo: "Segurança do Trabalho",
          descricao:
            "Programas obrigatórios, treinamentos normativos e resposta a emergência, sempre atualizados às NRs.",
          bullets: [
            "PGR (Programa de Gerenciamento de Riscos) e PCMSO",
            "Laudos de insalubridade e periculosidade",
            "Treinamentos normativos (NRs)",
            "Formação e gestão de brigada de incêndio",
          ],
          href: "#solucoes",
        },
      ],
    },
    solucoes: {
      eyebrow: "Soluções e serviços",
      title: "Consultoria completa, do licenciamento à segurança do trabalho",
      items: [
        {
          id: "licenciamento",
          iconKey: "FileCheck2",
          titulo: "Licenciamento Ambiental",
          descricao:
            "Regularização junto a órgãos ambientais municipais, estaduais e federais, do diagnóstico à emissão da licença.",
          colSpan: "lg:col-span-7",
          servicoParam: "licenciamento",
        },
        {
          id: "laudos-tecnicos",
          iconKey: "ClipboardCheck",
          titulo: "Laudos Técnicos",
          descricao:
            "Laudos de insalubridade, periculosidade, ruído e ergonomia com validade técnica e jurídica.",
          colSpan: "lg:col-span-5",
          servicoParam: "laudos-tecnicos",
        },
        {
          id: "pgr-pcmso",
          iconKey: "ShieldCheck",
          titulo: "PGR / PCMSO",
          descricao:
            "Programa de Gerenciamento de Riscos e Programa de Controle Médico de Saúde Ocupacional.",
          colSpan: "lg:col-span-4",
          servicoParam: "pgr-pcmso",
        },
        {
          id: "gestao-residuos",
          iconKey: "Recycle",
          titulo: "Gestão de Resíduos",
          descricao:
            "Plano de Gerenciamento de Resíduos Sólidos (PGRS) da geração à destinação final.",
          colSpan: "lg:col-span-4",
          servicoParam: "gestao-residuos",
        },
        {
          id: "treinamentos-nr",
          iconKey: "HardHat",
          titulo: "Treinamentos NR",
          descricao:
            "Treinamentos normativos aplicados à realidade operacional de cada cliente.",
          colSpan: "lg:col-span-4",
          servicoParam: "treinamentos-nr",
        },
        {
          id: "brigada-incendio",
          iconKey: "Siren",
          titulo: "Brigada de Incêndio",
          descricao:
            "Formação, treinamento e gestão contínua de brigada de incêndio conforme NR-23.",
          colSpan: "lg:col-span-12",
          servicoParam: "brigada-incendio",
        },
      ],
    },
    portalCliente: {
      eyebrow: "Portal do cliente",
      title: "Acompanhe sua conformidade em tempo real, não em relatório anual",
      description:
        "O mesmo sistema usado para entregar a consultoria também fica disponível para você acompanhar — sem depender de e-mail ou planilha.",
      ctaLabel: "Acessar portal do cliente",
      portalUrl,
      items: [
        {
          id: "financeiro",
          iconKey: "BarChart3",
          titulo: "Financeiro",
          descricao:
            "Cobranças, contratos e notas em um único lugar, sem depender de e-mail ou planilha.",
          bullets: [
            "Cobranças e contratos centralizados",
            "Histórico de notas e pagamentos",
            "Visão consolidada por unidade ou contrato",
          ],
          colSpan: "lg:col-span-6",
        },
        {
          id: "monitoramento",
          iconKey: "Activity",
          titulo: "Monitoramento em tempo real",
          descricao:
            "Acompanhe indicadores ambientais e de segurança sem esperar o relatório anual.",
          bullets: [
            "Indicadores atualizados em tempo real",
            "Alertas automáticos de desvio",
            "Histórico pronto para auditoria e fiscalização",
          ],
          colSpan: "lg:col-span-6",
        },
      ],
    },
    segmentos: {
      eyebrow: "Segmentos atendidos",
      title: "Indústrias que dependem de conformidade contínua",
      items: [
        { id: "industria", iconKey: "Factory", nome: "Indústria" },
        { id: "agronegocio", iconKey: "Sprout", nome: "Agronegócio" },
        {
          id: "construcao-civil",
          iconKey: "Building2",
          nome: "Construção Civil",
        },
        { id: "logistica", iconKey: "Truck", nome: "Logística e Transporte" },
        { id: "mineracao", iconKey: "Mountain", nome: "Mineração" },
        { id: "energia", iconKey: "Zap", nome: "Energia" },
      ],
    },
    diferenciais: {
      eyebrow: "Diferenciais",
      title: "Por que empresas escolhem a Ambiental",
      items: [
        {
          id: "equipe-multidisciplinar",
          iconKey: "Users",
          titulo: "Equipe técnica multidisciplinar",
          descricao:
            "Engenheiros ambientais, técnicos de segurança e especialistas em normas regulamentadoras.",
        },
        {
          id: "tecnologia-propria",
          iconKey: "LayoutDashboard",
          titulo: "Tecnologia própria",
          descricao:
            "Portal exclusivo para acompanhar financeiro e indicadores sem depender de terceiros.",
        },
        {
          id: "atendimento-nacional",
          iconKey: "Globe2",
          titulo: "Atendimento nacional",
          descricao:
            "Estrutura preparada para atender operações em múltiplas regiões do país.",
        },
        {
          id: "conformidade-atualizada",
          iconKey: "AlertTriangle",
          titulo: "Conformidade sempre atualizada",
          descricao:
            "Acompanhamento contínuo de mudanças em normas e prazos regulatórios.",
        },
        {
          id: "prazo-resposta",
          iconKey: "Clock",
          titulo: "Prazo de resposta ágil",
          descricao:
            "Diagnóstico inicial rápido para não travar a operação do cliente.",
        },
        {
          id: "suporte-dedicado",
          iconKey: "Headset",
          titulo: "Suporte técnico dedicado",
          descricao:
            "Time técnico acessível para dúvidas de conformidade e uso do portal.",
        },
      ],
    },
    depoimentos: {
      eyebrow: "Depoimentos",
      title: "Quem acompanha a conformidade com a gente",
      items: [
        {
          id: "depoimento-1",
          nome: "Depoimento ilustrativo",
          cargo: "Gestor(a) de SESMT",
          empresa: "Indústria de médio porte",
          texto:
            "Ter os indicadores de segurança acessíveis em tempo real mudou a forma como acompanhamos a conformidade entre as visitas técnicas.",
          isPlaceholder: true,
        },
        {
          id: "depoimento-2",
          nome: "Depoimento ilustrativo",
          cargo: "Diretor(a) industrial",
          empresa: "Operação multi-unidade",
          texto:
            "A consultoria organizou nosso licenciamento e o portal deu visibilidade financeira que antes dependia de planilha.",
          isPlaceholder: true,
        },
        {
          id: "depoimento-3",
          nome: "Depoimento ilustrativo",
          cargo: "Responsável por compliance ambiental",
          empresa: "Setor de logística",
          texto:
            "O acompanhamento contínuo evitou que a gente fosse pego de surpresa em uma fiscalização.",
          isPlaceholder: true,
        },
      ],
      carousel: {
        enabled: true,
        autoplay: true,
        intervalMs: 5500,
        loop: true,
      },
    },
    abrangencia: {
      eyebrow: "Abrangência",
      title: "Onde atuamos",
      footnote:
        "* Regiões de atuação ilustrativas — consulte disponibilidade para sua localidade.",
      items: [
        { regiao: "Sudeste", estados: ["SP", "RJ", "MG", "ES"] },
        { regiao: "Sul", estados: ["PR", "SC", "RS"] },
        { regiao: "Centro-Oeste", estados: ["GO", "MT", "MS", "DF"] },
        { regiao: "Nordeste", estados: ["BA", "PE", "CE"] },
        { regiao: "Norte", estados: ["PA", "AM"] },
      ],
    },
    comoFunciona: {
      eyebrow: "Como funciona",
      title: "Consultoria e portal, a mesma jornada",
      description:
        "A execução dos serviços e o acompanhamento pelo portal não são produtos separados — são etapas da mesma operação.",
      items: [
        {
          id: "diagnostico",
          numero: "01",
          titulo: "Diagnóstico inicial",
          descricao:
            "Levantamento do cenário ambiental e de segurança do trabalho da operação.",
        },
        {
          id: "execucao",
          numero: "02",
          titulo: "Execução da consultoria",
          descricao:
            "Licenciamento, laudos, programas obrigatórios e treinamentos conduzidos pela equipe técnica.",
        },
        {
          id: "acompanhamento",
          numero: "03",
          titulo: "Acompanhamento contínuo pelo portal",
          descricao:
            "Financeiro e indicadores acompanhados em tempo real, como parte da mesma jornada.",
        },
      ],
    },
    faq: {
      eyebrow: "Perguntas frequentes",
      title: "Dúvidas sobre a consultoria e o portal",
      items: [
        {
          id: "prazo-implantacao",
          pergunta: "Qual o prazo para implantar a consultoria?",
          resposta:
            "O prazo varia conforme o escopo (licenciamento, laudos, programas obrigatórios) e a complexidade da operação. O diagnóstico inicial define um cronograma específico para cada cliente.",
        },
        {
          id: "abrangencia-geografica",
          pergunta: "Vocês atendem em qual abrangência geográfica?",
          resposta:
            "Atendemos operações em diferentes regiões do país. As regiões de atuação atual estão listadas na seção Abrangência — consulte-nos para confirmar disponibilidade na sua localidade.",
        },
        {
          id: "o-que-e-portal",
          pergunta: "O que é o portal do cliente?",
          resposta:
            "É o sistema usado para acompanhar, em tempo real, os dados financeiros (cobranças, contratos, notas) e os indicadores ambientais e de segurança do trabalho gerados pela consultoria — sem depender de relatório em PDF ou planilha.",
        },
        {
          id: "lgpd-dados-sensiveis",
          pergunta:
            "Como os dados de indicadores ambientais são tratados em relação à LGPD?",
          resposta:
            "Os dados de indicadores e informações de contrato são tratados conforme a Lei Geral de Proteção de Dados (LGPD), com acesso restrito ao cliente e à equipe técnica responsável pelo atendimento.",
        },
        {
          id: "cancelamento-renovacao",
          pergunta: "Como funciona o cancelamento ou renovação?",
          resposta:
            "As condições de cancelamento e renovação são definidas em contrato no momento da contratação, de acordo com o serviço (consultoria avulsa ou assinatura do portal).",
        },
        {
          id: "consultoria-vs-portal",
          pergunta:
            "Qual a diferença entre contratar a consultoria avulsa e assinar o portal?",
          resposta:
            "A consultoria avulsa cobre a execução de um serviço específico (um laudo, um licenciamento). A assinatura do portal dá acompanhamento contínuo dos indicadores e do financeiro gerados pelos serviços contratados — as duas frentes fazem parte da mesma jornada, não são produtos separados.",
        },
      ],
    },
    ctaFinal: {
      eyebrow: "Fale com a gente",
      title: "Pronto para colocar sua conformidade em dia?",
      description:
        "Preencha o formulário e um consultor entra em contato para entender o cenário da sua empresa.",
    },
  };
}

export type LandingContentPayload = ReturnType<typeof getDefaultLandingContent>;
