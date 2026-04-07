import type { PrismaClient } from '@prisma/client'

/**
 * Garante centros de custo e categorias financeiras padrão para frota (idempotente por organization_id + codigo).
 * Chame após criar organização ou em migração de dados.
 */
export async function ensureFrotaFinanceiroDefaults(
  prisma: PrismaClient,
  organizationId: string
) {
  const centros = [
    {
      codigo: 'FROTA',
      nome: 'Frota',
      descricao: 'Centro de custo geral da frota',
    },
    {
      codigo: 'FROTA-CAM',
      nome: 'Frota — Caminhões',
      descricao: 'Subcentro — caminhões',
    },
    {
      codigo: 'FROTA-CAR',
      nome: 'Frota — Carros',
      descricao: 'Subcentro — carros',
    },
  ]

  for (const c of centros) {
    await prisma.centroCusto.upsert({
      where: {
        organization_id_codigo: {
          organization_id: organizationId,
          codigo: c.codigo,
        },
      },
      create: {
        organization_id: organizationId,
        codigo: c.codigo,
        nome: c.nome,
        descricao: c.descricao,
        ativo: true,
      },
      update: {},
    })
  }

  const categoriasDespesa = [
    { codigo: 'FRT-COMB', nome: 'Combustível' },
    { codigo: 'FRT-MANUT', nome: 'Manutenção' },
    { codigo: 'FRT-SEGURO', nome: 'Seguro' },
    { codigo: 'FRT-IPVA', nome: 'IPVA' },
    { codigo: 'FRT-PED', nome: 'Pedágio' },
  ]

  for (const cat of categoriasDespesa) {
    await prisma.categoriaFinanceira.upsert({
      where: {
        organization_id_codigo: {
          organization_id: organizationId,
          codigo: cat.codigo,
        },
      },
      create: {
        organization_id: organizationId,
        codigo: cat.codigo,
        nome: cat.nome,
        tipo: 'DESPESA',
        nivel: 1,
        ativo: true,
      },
      update: {},
    })
  }

  const categoriasReceita = [
    { codigo: 'FRT-FRETE', nome: 'Frete' },
    { codigo: 'FRT-TRANSP', nome: 'Transporte' },
    { codigo: 'FRT-LOG', nome: 'Logística' },
  ]

  for (const cat of categoriasReceita) {
    await prisma.categoriaFinanceira.upsert({
      where: {
        organization_id_codigo: {
          organization_id: organizationId,
          codigo: cat.codigo,
        },
      },
      create: {
        organization_id: organizationId,
        codigo: cat.codigo,
        nome: cat.nome,
        tipo: 'RECEITA',
        nivel: 1,
        ativo: true,
      },
      update: {},
    })
  }
}
