import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LancamentoService } from '@/services/lancamento.service'
import { prisma } from '@/lib/prisma'
import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import { Decimal } from '@prisma/client/runtime/library'

// Mock do Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    lancamento: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
    categoriaFinanceira: {
      findFirst: vi.fn(),
    },
    contaBancaria: {
      findFirst: vi.fn(),
    },
    centroCusto: {
      findFirst: vi.fn(),
    },
    parceiro: {
      findFirst: vi.fn(),
    },
  },
}))

describe('LancamentoService', () => {
  const organizationId = '123e4567-e89b-12d3-a456-426614174000'
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('list', () => {
    it('deve listar lançamentos com paginação', async () => {
      const mockLancamentos = [
        {
          id: '1',
          numero: 'LANC-001',
          tipo: 'RECEITA',
          valor: new Decimal(1000),
          valor_pago: null,
          data: new Date(),
          parceiro: null,
          conta_bancaria: { id: '1', nome: 'Conta Principal' },
          categoria: { id: '1', nome: 'Vendas', tipo: 'RECEITA' },
          centro_custo: null,
        },
      ]

      vi.mocked(prisma.lancamento.findMany).mockResolvedValue(mockLancamentos as any)
      vi.mocked(prisma.lancamento.count).mockResolvedValue(1)

      const result = await LancamentoService.list(organizationId, {
        page: 1,
        limit: 10,
      })

      expect(result.lancamentos).toHaveLength(1)
      expect(result.pagination.total).toBe(1)
      expect(result.pagination.pages).toBe(1)
      expect(prisma.lancamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organization_id: organizationId,
          }),
        })
      )
    })

    it('deve aplicar filtro de busca', async () => {
      vi.mocked(prisma.lancamento.findMany).mockResolvedValue([])
      vi.mocked(prisma.lancamento.count).mockResolvedValue(0)

      await LancamentoService.list(organizationId, {
        search: 'teste',
      })

      expect(prisma.lancamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { numero: { contains: 'teste', mode: 'insensitive' } },
              { descricao: { contains: 'teste', mode: 'insensitive' } },
            ]),
          }),
        })
      )
    })

    it('deve aplicar filtro de tipo', async () => {
      vi.mocked(prisma.lancamento.findMany).mockResolvedValue([])
      vi.mocked(prisma.lancamento.count).mockResolvedValue(0)

      await LancamentoService.list(organizationId, {
        tipo: 'RECEITA',
      })

      expect(prisma.lancamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tipo: 'RECEITA',
          }),
        })
      )
    })

    it('deve aplicar filtros de data', async () => {
      vi.mocked(prisma.lancamento.findMany).mockResolvedValue([])
      vi.mocked(prisma.lancamento.count).mockResolvedValue(0)

      const dataInicio = '2024-01-01'
      const dataFim = '2024-12-31'

      await LancamentoService.list(organizationId, {
        data_inicio: dataInicio,
        data_fim: dataFim,
        filtrar_por: 'data',
      })

      expect(prisma.lancamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            data: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      )
    })

    it('deve aplicar filtro de valor mínimo e máximo', async () => {
      vi.mocked(prisma.lancamento.findMany).mockResolvedValue([])
      vi.mocked(prisma.lancamento.count).mockResolvedValue(0)

      await LancamentoService.list(organizationId, {
        valor_min: '100',
        valor_max: '1000',
      })

      expect(prisma.lancamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            valor: expect.objectContaining({
              gte: expect.any(Decimal),
              lte: expect.any(Decimal),
            }),
          }),
        })
      )
    })

    it('deve aplicar filtro de apenas vencidos', async () => {
      vi.mocked(prisma.lancamento.findMany).mockResolvedValue([])
      vi.mocked(prisma.lancamento.count).mockResolvedValue(0)

      await LancamentoService.list(organizationId, {
        apenas_vencidos: true,
      })

      expect(prisma.lancamento.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            data_vencimento: { lt: expect.any(Date) },
            pago: false,
          }),
        })
      )
    })
  })

  describe('findById', () => {
    it('deve retornar um lançamento por ID', async () => {
      const mockLancamento = {
        id: '1',
        numero: 'LANC-001',
        tipo: 'RECEITA',
        valor: new Decimal(1000),
        valor_pago: null,
        data: new Date(),
        parceiro: null,
        conta_bancaria: { id: '1', nome: 'Conta Principal' },
        categoria: { id: '1', nome: 'Vendas', tipo: 'RECEITA' },
        centro_custo: null,
        parcelas: [],
        documentos: [],
      }

      vi.mocked(prisma.lancamento.findFirst).mockResolvedValue(mockLancamento as any)

      const result = await LancamentoService.findById('1', organizationId)

      expect(result.id).toBe('1')
      expect(result.valor).toBe(1000)
      expect(prisma.lancamento.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: '1',
            organization_id: organizationId,
          },
        })
      )
    })

    it('deve lançar erro se lançamento não for encontrado', async () => {
      vi.mocked(prisma.lancamento.findFirst).mockResolvedValue(null)

      await expect(
        LancamentoService.findById('1', organizationId)
      ).rejects.toThrow(BadRequestError)
    })
  })

  describe('create', () => {
    const createData = {
      numero: 'LANC-001',
      tipo: 'RECEITA' as const,
      data: '2024-01-01',
      descricao: 'Teste',
      valor: 1000,
      forma_parcelamento: 'UNICA' as const,
      numero_parcelas: 1,
      categoria_id: 'cat-1',
      conta_bancaria_id: 'conta-1',
      pago: false,
      status_lancamento: 'PENDENTE' as const,
    }

    it('deve criar um lançamento', async () => {
      // Mock das validações
      vi.mocked(prisma.categoriaFinanceira.findFirst).mockResolvedValue({ id: 'cat-1' } as any)
      vi.mocked(prisma.contaBancaria.findFirst).mockResolvedValue({ id: 'conta-1' } as any)

      const mockCreatedLancamento = {
        id: '1',
        ...createData,
        valor: new Decimal(1000),
      }

      vi.mocked(prisma.lancamento.create).mockResolvedValue(mockCreatedLancamento as any)

      const result = await LancamentoService.create(organizationId, createData)

      expect(result.id).toBe('1')
      expect(prisma.lancamento.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            numero: 'LANC-001',
            organization_id: organizationId,
          }),
        })
      )
    })

    it('deve validar categoria inexistente', async () => {
      vi.mocked(prisma.categoriaFinanceira.findFirst).mockResolvedValue(null)

      await expect(
        LancamentoService.create(organizationId, createData)
      ).rejects.toThrow('Categoria financeira não encontrada')
    })

    it('deve validar conta bancária inexistente', async () => {
      vi.mocked(prisma.categoriaFinanceira.findFirst).mockResolvedValue({ id: 'cat-1' } as any)
      vi.mocked(prisma.contaBancaria.findFirst).mockResolvedValue(null)

      await expect(
        LancamentoService.create(organizationId, createData)
      ).rejects.toThrow('Conta bancária não encontrada')
    })
  })

  describe('update', () => {
    const updateData = {
      descricao: 'Descrição Atualizada',
      valor: 1500,
    }

    it('deve atualizar um lançamento', async () => {
      const mockExistingLancamento = {
        id: '1',
        organization_id: organizationId,
      }

      vi.mocked(prisma.lancamento.findFirst).mockResolvedValue(mockExistingLancamento as any)
      vi.mocked(prisma.lancamento.update).mockResolvedValue({
        ...mockExistingLancamento,
        ...updateData,
      } as any)

      await LancamentoService.update('1', organizationId, updateData)

      expect(prisma.lancamento.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({
            descricao: 'Descrição Atualizada',
          }),
        })
      )
    })

    it('deve lançar erro se lançamento não existir', async () => {
      vi.mocked(prisma.lancamento.findFirst).mockResolvedValue(null)

      await expect(
        LancamentoService.update('1', organizationId, updateData)
      ).rejects.toThrow('Lançamento não encontrado')
    })
  })

  describe('delete', () => {
    it('deve deletar um lançamento', async () => {
      vi.mocked(prisma.lancamento.findFirst).mockResolvedValue({ id: '1' } as any)
      vi.mocked(prisma.lancamento.delete).mockResolvedValue({} as any)

      await LancamentoService.delete('1', organizationId)

      expect(prisma.lancamento.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      })
    })

    it('deve lançar erro se lançamento não existir', async () => {
      vi.mocked(prisma.lancamento.findFirst).mockResolvedValue(null)

      await expect(
        LancamentoService.delete('1', organizationId)
      ).rejects.toThrow('Lançamento não encontrado')
    })
  })

  describe('getStatistics', () => {
    it('deve retornar estatísticas de lançamentos', async () => {
      vi.mocked(prisma.lancamento.aggregate).mockResolvedValueOnce({
        _sum: { valor: new Decimal(5000) },
      } as any)
      vi.mocked(prisma.lancamento.aggregate).mockResolvedValueOnce({
        _sum: { valor: new Decimal(3000) },
      } as any)
      vi.mocked(prisma.lancamento.count).mockResolvedValueOnce(10)
      vi.mocked(prisma.lancamento.count).mockResolvedValueOnce(5)

      const result = await LancamentoService.getStatistics(organizationId)

      expect(result.total_receitas).toBe(5000)
      expect(result.total_despesas).toBe(3000)
      expect(result.saldo).toBe(2000)
      expect(result.total_pendentes).toBe(10)
      expect(result.total_pagos).toBe(5)
    })
  })
})