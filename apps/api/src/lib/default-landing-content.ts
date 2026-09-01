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
    { label: "Início", href: "#top" },
    { label: "Soluções", href: "/servicos" },
    { label: "Projetos", href: "/projetos" },
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
        label: "Solicitar Orçamento",
        href: "#contato",
        variant: "primary" as const,
      },
      portalCta: {
        label: "Acessar portal do cliente",
        href: portalUrl,
        variant: "tech" as const,
      },
      portalUrl,
      topBar: {
        phone: "(96) 98113-9394",
        email: "ambiental.servicosap@hotmail.com",
        location: "Macapá — AP",
      },
      whatsapp: {
        label: "WhatsApp",
        href: "https://wa.me/5596990453300",
        variant: "outline" as const,
      },
    },
    footer: {
      brandName: "Ambiental Consultoria",
      tagline:
        "Desde 2012 solucionando desafios ambientais, de segurança do trabalho e engenharia para empresas no Amapá e no Brasil.",
      legalLine:
        "Rod. Juscelino Kubitscheck, 4550 — Chefe Clodoaldo, Macapá — AP, 68903-197",
      navItems,
      socialLinks: [
        {
          label: "Facebook",
          href: "https://www.facebook.com/profile.php?id=100091911303940",
          ariaLabel: "Facebook da Ambiental Consultoria",
        },
        {
          label: "Instagram",
          href: "https://www.instagram.com/ambiental_consultoriaap/",
          ariaLabel: "Instagram da Ambiental Consultoria",
        },
        {
          label: "LinkedIn",
          href: "https://www.linkedin.com/company/ambiental-consultoria-e-servi%C3%A7os-eireli/",
          ariaLabel: "LinkedIn da Ambiental Consultoria",
        },
      ],
      privacyHref: "/politica-de-privacidade",
      privacyLabel: "Política de privacidade (LGPD)",
      contact: {
        address:
          "Rod. Juscelino Kubitscheck, 4550 — Chefe Clodoaldo, Macapá — AP, 68903-197",
        phone: "(96) 98113-9394 / (96) 98116-1192",
        whatsapp: "https://wa.me/5596990453300",
        email: "ambiental.servicosap@hotmail.com",
      },
    },
    hero: {
      layout: "immersive" as const,
      carousel: {
        enabled: true,
        autoplay: true,
        intervalMs: 6500,
        loop: true,
      },
      wave: { enabled: true },
      slides: [
        {
          id: "conformidade",
          eyebrow: "Desde 2012 no Amapá e no Brasil",
          headline: "Conformidade ocupacional com",
          highlight: "dados em tempo real",
          accentText: "SST",
          subheadline:
            "PCMSO, PGR, ASO e laudos técnicos conduzidos por equipe especializada — com portal próprio para acompanhar indicadores.",
          ctas: [
            {
              label: "Solicitar Orçamento",
              href: "#contato",
              variant: "primary" as const,
            },
            {
              label: "Ver o portal",
              href: "#portal-cliente",
              variant: "outline" as const,
            },
          ],
          media: { kind: "none" as const, motion: "kenburns" as const },
        },
        {
          id: "ambiental",
          eyebrow: "Consultoria Ambiental",
          headline: "Licenciamento e gestão",
          highlight: "ambiental",
          accentText: "ESG",
          subheadline:
            "Regularização, condicionantes e monitoramento conduzidos com equipe multidisciplinar e tecnologia própria.",
          ctas: [
            {
              label: "Conhecer serviços",
              href: "/servicos",
              variant: "primary" as const,
            },
          ],
          media: { kind: "none" as const, motion: "none" as const },
        },
        {
          id: "monitoramento",
          eyebrow: "Portal do Cliente",
          headline: "Monitoramento e indicadores",
          highlight: "ao vivo",
          accentText: "24/7",
          subheadline:
            "Acompanhe licenciamento, laudos e alertas sem depender de planilha ou visita surpresa do fiscal.",
          ctas: [
            {
              label: "Acessar portal",
              href: "#portal-cliente",
              variant: "tech" as const,
            },
          ],
          media: { kind: "none" as const, motion: "none" as const },
        },
      ],
      eyebrow: "Desde 2012 no Amapá e no Brasil",
      headline:
        "Cuidando da sua empresa, do seu time e do meio ambiente — com dados em tempo real, não em PDF anual.",
      subheadline:
        "Consultoria técnica em meio ambiente e segurança do trabalho, com portal próprio para acompanhar licenciamento, laudos e indicadores sem depender de planilha ou visita surpresa do fiscal.",
      ctas: [
        {
          label: "Solicitar Orçamento",
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
          id: "anos-atuacao",
          valor: 13,
          sufixo: "+",
          label: "anos de mercado desde 2012",
        },
        {
          id: "projetos-entregues",
          valor: 300,
          sufixo: "+",
          label: "projetos entregues",
        },
      ],
      media: { kind: "none" as const, motion: "none" as const },
    },
    provaSocial: {
      metrics: [
        {
          id: "anos-atuacao",
          valor: 13,
          sufixo: "+",
          label: "anos de mercado desde 2012",
        },
        {
          id: "projetos-entregues",
          valor: 300,
          sufixo: "+",
          label: "projetos entregues",
        },
        {
          id: "especialidades",
          valor: 9,
          label: "áreas de especialidade",
        },
      ],
      logosEyebrow: "Confiado por empresas de diferentes setores",
      logos: Array.from({ length: 6 }, (_, i) => ({
        id: `logo-placeholder-${i + 1}`,
        nome: "Logo do cliente",
        isPlaceholder: true,
      })),
      logosCarousel: {
        enabled: true,
        autoplay: true,
        intervalMs: 5000,
        loop: true,
      },
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
          id: "seguranca",
          iconKey: "ShieldCheck",
          titulo: "Segurança do Trabalho",
          descricao:
            "Programas, laudos e documentação para prevenir acidentes e adequar sua empresa às normas regulamentadoras.",
          descricaoLonga:
            "Elaboramos programas de prevenção, mapas de risco, rotas de fuga e laudos técnicos, cuidando da conformidade e da segurança de todos os colaboradores.",
          colSpan: "lg:col-span-6",
          servicoParam: "seguranca",
        },
        {
          id: "meio-ambiente",
          iconKey: "Leaf",
          titulo: "Meio Ambiente",
          descricao:
            "Licenciamento, cadastros e laudos técnicos para empresas que precisam atender às exigências ambientais.",
          descricaoLonga:
            "Da regularização junto aos órgãos competentes à elaboração de laudos técnicos, apoiamos sua empresa em todo o processo de adequação ambiental.",
          colSpan: "lg:col-span-6",
          servicoParam: "meio-ambiente",
        },
        {
          id: "aerolevantamento",
          iconKey: "Plane",
          titulo: "Aerolevantamento",
          descricao:
            "Levantamento aerogeofísico e aerofotogrametria para mapear terrenos e territórios com precisão.",
          descricaoLonga:
            "Serviço aéreo de medição de terrenos e espaços marítimos, usado na construção de mapas e plantas e no controle de fronteiras.",
          colSpan: "lg:col-span-4",
          servicoParam: "aerolevantamento",
        },
        {
          id: "sismografia",
          iconKey: "Activity",
          titulo: "Sismografia",
          descricao:
            "Monitoramento de vibrações e ruído para garantir a segurança estrutural de edificações.",
          descricaoLonga:
            "Captamos e interpretamos ondas sísmicas e acústicas com sismógrafos de precisão, avaliando vibração e pressão acústica em diferentes ambientes.",
          colSpan: "lg:col-span-4",
          servicoParam: "sismografia",
        },
        {
          id: "hidrossemeadura",
          iconKey: "Sprout",
          titulo: "Hidrossemeadura",
          descricao:
            "Recuperação de áreas degradadas por jateamento de sementes, fertilizantes e fibra de madeira.",
          descricaoLonga:
            "Solução de alta viscosidade aplicada por hidrojateamento, que dispensa preparo do solo e acelera a germinação em qualquer tipo de terreno.",
          colSpan: "lg:col-span-4",
          servicoParam: "hidrossemeadura",
        },
        {
          id: "logistica",
          iconKey: "Truck",
          titulo: "Logística",
          descricao:
            "Frota moderna e equipe experiente para transporte especializado da sua cadeia de suprimentos.",
          descricaoLonga:
            "Soluções logísticas personalizadas, com agilidade e segurança, para otimizar operações de transporte e frete.",
          colSpan: "lg:col-span-4",
          servicoParam: "logistica",
          imagem: {
            url: "/images/Frete%20e%20Logistica%20-%20Ambiental%20Consultoria.png",
            alt: "Frete e Logística — Ambiental Consultoria",
          },
        },
        {
          id: "monitoramento",
          iconKey: "Gauge",
          titulo: "Instrumentação para Monitoramento",
          descricao:
            "Monitoramento de barragens e consultoria para uma gestão sustentável de estruturas críticas.",
          descricaoLonga:
            "Oferecemos consultoria e treinamento para melhorar práticas de gestão de barragens, protegendo comunidades e ecossistemas aquáticos.",
          colSpan: "lg:col-span-4",
          servicoParam: "monitoramento",
        },
        {
          id: "incendio",
          iconKey: "Flame",
          titulo: "Combate a Incêndio e Pânico",
          descricao:
            "Projetos técnicos para detecção, controle e contenção de incêndios em edificações.",
          descricaoLonga:
            "Especificações técnicas completas para prevenção e combate a incêndio e pânico, atendendo às exigências do corpo de bombeiros.",
          colSpan: "lg:col-span-4",
          servicoParam: "incendio",
        },
        {
          id: "mineracao",
          iconKey: "Mountain",
          titulo: "Mineração e Geotécnica",
          descricao:
            "Engenharia geotécnica e suporte técnico para operações de mineração com segurança.",
          descricaoLonga:
            "Suporte técnico especializado em engenharia geotécnica e mineração, do estudo do solo à operação segura.",
          colSpan: "lg:col-span-12",
          servicoParam: "mineracao",
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
      footnote: "Sede em Macapá — AP, com atuação em todo o território nacional.",
      items: [
        { regiao: "Amapá", estados: ["Macapá", "Santana", "Região Metropolitana"] },
        { regiao: "Brasil", estados: ["Atendimento em todo o território nacional"] },
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
    projetos: {
      eyebrow: "Nosso trabalho",
      title: "Projetos",
      description:
        "Uma amostra dos trabalhos técnicos que já entregamos para clientes no Amapá e no Brasil.",
      items: [
        {
          id: "licenciamento-terminal-logistico",
          categoria: "meio-ambiente",
          titulo: "Licenciamento de terminal logístico",
          descricao: "Regularização ambiental completa junto ao órgão estadual.",
          imagens: [] as Array<{ url: string; alt?: string }>,
        },
        {
          id: "programa-seguranca-industria",
          categoria: "seguranca",
          titulo: "Programa de segurança para indústria",
          descricao: "Mapeamento de risco e treinamento de equipe operacional.",
          imagens: [] as Array<{ url: string; alt?: string }>,
        },
        {
          id: "mapeamento-aerofotogrametrico",
          categoria: "aerolevantamento",
          titulo: "Mapeamento aerofotogramétrico rural",
          descricao:
            "Levantamento de área de 1.200 hectares para planejamento fundiário.",
          imagens: [] as Array<{ url: string; alt?: string }>,
        },
        {
          id: "monitoramento-vibracao-obra",
          categoria: "sismografia",
          titulo: "Monitoramento de vibração em obra urbana",
          descricao: "Controle de vibração e ruído durante fundação de edifício.",
          imagens: [] as Array<{ url: string; alt?: string }>,
        },
        {
          id: "recuperacao-talude-rodoviario",
          categoria: "hidrossemeadura",
          titulo: "Recuperação de talude rodoviário",
          descricao:
            "Revegetação por hidrossemeadura em trecho de rodovia estadual.",
          imagens: [] as Array<{ url: string; alt?: string }>,
        },
        {
          id: "transporte-equipamentos-mineracao",
          categoria: "logistica",
          titulo: "Transporte especializado de equipamentos",
          descricao: "Logística de cargas técnicas para operação de mineração.",
          imagens: [] as Array<{ url: string; alt?: string }>,
        },
        {
          id: "monitoramento-barragem-rejeito",
          categoria: "monitoramento",
          titulo: "Monitoramento de barragem de rejeito",
          descricao:
            "Instalação de instrumentação geotécnica e leitura periódica.",
          imagens: [] as Array<{ url: string; alt?: string }>,
        },
        {
          id: "ppci-galpao-industrial",
          categoria: "incendio",
          titulo: "Projeto de PPCI para galpão industrial",
          descricao:
            "Projeto técnico completo aprovado junto ao corpo de bombeiros.",
          imagens: [] as Array<{ url: string; alt?: string }>,
        },
        {
          id: "suporte-geotecnico-cava-mineracao",
          categoria: "mineracao",
          titulo: "Suporte geotécnico em cava de mineração",
          descricao: "Consultoria em estabilidade de taludes para operação segura.",
          imagens: [] as Array<{ url: string; alt?: string }>,
        },
      ],
    },
  };
}

export type LandingContentPayload = ReturnType<typeof getDefaultLandingContent>;
