// src/routes/pagamentos.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { 
  Barbeiro, 
  ConfiguracaoPagamento, 
  CalculoPagamento, 
  DescontoPagamento,
  Venda,
  VendaItem,
  Servico,
  Produto
} = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Buscar configurações de pagamento
router.get('/configuracoes', async (req, res) => {
  try {
    const configuracoes = await ConfiguracaoPagamento.findAll({
      include: [{
        model: Barbeiro,
        as: 'barbeiro',
        attributes: ['id', 'nome', 'ativo']
      }],
      where: { ativo: true },
      order: [['barbeiro', 'nome', 'ASC']]
    });

    res.json({ configuracoes });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar/Atualizar configuração de pagamento
router.post('/configuracoes', [
  body('barbeiroId').isInt().withMessage('Barbeiro é obrigatório'),
  body('tipoComissao').isIn(['porcentagem', 'valor_fixo', 'aluguel_cadeira']).withMessage('Tipo de comissão inválido'),
  body('porcentagemServicos').optional().isFloat({ min: 0, max: 100 }).withMessage('Porcentagem de serviços inválida'),
  body('porcentagemProdutos').optional().isFloat({ min: 0, max: 100 }).withMessage('Porcentagem de produtos inválida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { barbeiroId } = req.body;

    // Desativar configuração anterior
    await ConfiguracaoPagamento.update(
      { ativo: false, dataFim: new Date() },
      { where: { barbeiroId, ativo: true } }
    );

    // Criar nova configuração
    const configuracao = await ConfiguracaoPagamento.create({
      ...req.body,
      dataInicio: new Date()
    });

    const configuracaoCompleta = await ConfiguracaoPagamento.findByPk(configuracao.id, {
      include: [{
        model: Barbeiro,
        as: 'barbeiro',
        attributes: ['id', 'nome']
      }]
    });

    res.status(201).json(configuracaoCompleta);
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Calcular pagamentos por período
router.post('/calcular', [
  body('barbeiroId').optional().isInt(),
  body('periodoInicio').isDate().withMessage('Data de início inválida'),
  body('periodoFim').isDate().withMessage('Data de fim inválida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { barbeiroId, periodoInicio, periodoFim } = req.body;

    // Buscar barbeiros
    let whereClauseBarbeiro = { ativo: true };
    if (barbeiroId) {
      whereClauseBarbeiro.id = barbeiroId;
    }

    const barbeiros = await Barbeiro.findAll({
      where: whereClauseBarbeiro,
      include: [{
        model: ConfiguracaoPagamento,
        as: 'configuracoesPagamento',
        where: { ativo: true },
        required: true
      }]
    });

    const resultados = [];

    for (const barbeiro of barbeiros) {
      const configuracao = barbeiro.configuracoesPagamento[0];
      
      // Buscar vendas do barbeiro no período
      const vendas = await Venda.findAll({
        where: {
          barbeiroId: barbeiro.id,
          dataVenda: {
            [Op.between]: [periodoInicio, periodoFim]
          }
        },
        include: [{
          model: VendaItem,
          as: 'itens',
          include: [
            { model: Servico, as: 'servico' },
            { model: Produto, as: 'produto' }
          ]
        }]
      });

      // Calcular totais
      let totalServicos = 0;
      let totalProdutos = 0;

      vendas.forEach(venda => {
        venda.itens.forEach(item => {
          const subtotal = parseFloat(item.subtotal);
          if (item.servicoId) {
            totalServicos += subtotal;
          } else if (item.produtoId) {
            totalProdutos += subtotal;
          }
        });
      });

      const totalVendas = totalServicos + totalProdutos;

      // Calcular comissões baseado na configuração
      let comissaoServicos = 0;
      let comissaoProdutos = 0;
      let valorAluguel = 0;
      let bonusMeta = 0;

      switch (configuracao.tipoComissao) {
        case 'porcentagem':
          comissaoServicos = totalServicos * (parseFloat(configuracao.porcentagemServicos) / 100);
          comissaoProdutos = totalProdutos * (parseFloat(configuracao.porcentagemProdutos) / 100);
          break;
          
        case 'aluguel_cadeira':
          valorAluguel = parseFloat(configuracao.valorAluguelCadeira);
          // No aluguel de cadeira, o barbeiro fica com tudo menos o aluguel
          comissaoServicos = Math.max(0, totalServicos - valorAluguel);
          comissaoProdutos = totalProdutos * (parseFloat(configuracao.porcentagemProdutos) / 100);
          break;
          
        case 'valor_fixo':
          comissaoServicos = parseFloat(configuracao.valorFixoMensal);
          comissaoProdutos = totalProdutos * (parseFloat(configuracao.porcentagemProdutos) / 100);
          break;
      }

      // Verificar se atingiu meta para bônus
      if (configuracao.metaMensal > 0 && totalVendas >= parseFloat(configuracao.metaMensal)) {
        bonusMeta = totalVendas * (parseFloat(configuracao.bonusMeta) / 100);
      }

      // Buscar descontos pendentes
      const descontos = await DescontoPagamento.findAll({
        where: {
          barbeiroId: barbeiro.id,
          dataAplicacao: {
            [Op.between]: [periodoInicio, periodoFim]
          },
          aplicado: false
        }
      });

      const descontoTotal = descontos.reduce((total, desconto) => {
        return total + (desconto.tipo === 'desconto' || desconto.tipo === 'multa' ? 
          parseFloat(desconto.valor) : -parseFloat(desconto.valor));
      }, 0);

      const totalAPagar = comissaoServicos + comissaoProdutos + bonusMeta - valorAluguel;
      const valorLiquido = totalAPagar - descontoTotal;

      // Salvar ou atualizar cálculo
      const [calculo] = await CalculoPagamento.findOrCreate({
        where: {
          barbeiroId: barbeiro.id,
          periodoInicio,
          periodoFim
        },
        defaults: {
          totalVendas,
          totalServicos,
          totalProdutos,
          comissaoServicos,
          comissaoProdutos,
          valorAluguel,
          bonusMeta,
          totalAPagar,
          descontoTotal,
          valorLiquido
        }
      });

      if (!calculo.pago) {
        await calculo.update({
          totalVendas,
          totalServicos,
          totalProdutos,
          comissaoServicos,
          comissaoProdutos,
          valorAluguel,
          bonusMeta,
          totalAPagar,
          descontoTotal,
          valorLiquido
        });
      }

      resultados.push({
        barbeiro: {
          id: barbeiro.id,
          nome: barbeiro.nome
        },
        configuracao: {
          tipoComissao: configuracao.tipoComissao,
          porcentagemServicos: configuracao.porcentagemServicos,
          porcentagemProdutos: configuracao.porcentagemProdutos
        },
        vendas: vendas.length,
        totalVendas,
        totalServicos,
        totalProdutos,
        comissaoServicos,
        comissaoProdutos,
        valorAluguel,
        bonusMeta,
        descontoTotal,
        totalAPagar,
        valorLiquido,
        calculoId: calculo.id,
        pago: calculo.pago
      });
    }

    res.json({ resultados });
  } catch (error) {
    console.error('Erro ao calcular pagamentos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar relatório de pagamentos
router.get('/relatorio', async (req, res) => {
  try {
    const { periodo = 'mes', barbeiroId } = req.query;
    
    // Calcular datas baseado no período
    const hoje = new Date();
    let dataInicio, dataFim;
    
    switch (periodo) {
      case 'dia':
        dataInicio = new Date(hoje.setHours(0, 0, 0, 0));
        dataFim = new Date(hoje.setHours(23, 59, 59, 999));
        break;
      case 'semana':
        const inicioSemana = hoje.getDate() - hoje.getDay();
        dataInicio = new Date(hoje.setDate(inicioSemana));
        dataFim = new Date(hoje.setDate(inicioSemana + 6));
        break;
      case 'mes':
      default:
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        break;
    }

    let whereClause = {
      periodoInicio: { [Op.gte]: dataInicio },
      periodoFim: { [Op.lte]: dataFim }
    };

    if (barbeiroId) {
      whereClause.barbeiroId = barbeiroId;
    }

    const calculos = await CalculoPagamento.findAll({
      where: whereClause,
      include: [{
        model: Barbeiro,
        as: 'barbeiro',
        attributes: ['id', 'nome']
      }],
      order: [['barbeiro', 'nome', 'ASC']]
    });

    // Calcular resumo
    const resumo = {
      totalBarbeiros: calculos.length,
      totalVendas: calculos.reduce((sum, c) => sum + parseFloat(c.totalVendas), 0),
      totalComissoes: calculos.reduce((sum, c) => sum + parseFloat(c.totalAPagar), 0),
      totalLiquido: calculos.reduce((sum, c) => sum + parseFloat(c.valorLiquido), 0),
      totalPago: calculos.filter(c => c.pago).reduce((sum, c) => sum + parseFloat(c.valorLiquido), 0),
      totalPendente: calculos.filter(c => !c.pago).reduce((sum, c) => sum + parseFloat(c.valorLiquido), 0)
    };

    res.json({ calculos, resumo, periodo: { dataInicio, dataFim } });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Marcar pagamento como pago
router.patch('/marcar-pago/:id', [
  body('dataPagamento').isDate().withMessage('Data de pagamento inválida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const calculo = await CalculoPagamento.findByPk(req.params.id);
    if (!calculo) {
      return res.status(404).json({ message: 'Cálculo de pagamento não encontrado' });
    }

    await calculo.update({
      dataPagamento: req.body.dataPagamento,
      observacoes: req.body.observacoes || calculo.observacoes
    });

    // Marcar descontos como aplicados
    await DescontoPagamento.update(
      { aplicado: true },
      { 
        where: { 
          barbeiroId: calculo.barbeiroId,
          dataAplicacao: {
            [Op.between]: [calculo.periodoInicio, calculo.periodoFim]
          },
          aplicado: false 
        } 
      }
    );

    res.json({ message: 'Pagamento marcado como pago com sucesso', calculo });
  } catch (error) {
    console.error('Erro ao marcar pagamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Adicionar desconto/adiantamento
router.post('/descontos', [
  body('barbeiroId').isInt().withMessage('Barbeiro é obrigatório'),
  body('tipo').isIn(['desconto', 'adiantamento', 'bonus', 'multa']).withMessage('Tipo inválido'),
  body('descricao').isLength({ min: 3 }).withMessage('Descrição deve ter pelo menos 3 caracteres'),
  body('valor').isFloat({ min: 0.01 }).withMessage('Valor deve ser maior que zero'),
  body('dataAplicacao').isDate().withMessage('Data de aplicação inválida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const desconto = await DescontoPagamento.create({
      ...req.body,
      createdBy: req.user.id
    });

    const descontoCompleto = await DescontoPagamento.findByPk(desconto.id, {
      include: [
        { model: Barbeiro, as: 'barbeiro', attributes: ['id', 'nome'] },
        { model: Usuario, as: 'criadoPor', attributes: ['id', 'nome'] }
      ]
    });

    res.status(201).json(descontoCompleto);
  } catch (error) {
    console.error('Erro ao adicionar desconto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Listar descontos de um barbeiro
router.get('/descontos/:barbeiroId', async (req, res) => {
  try {
    const { periodo } = req.query;
    let whereClause = { barbeiroId: req.params.barbeiroId };

    if (periodo) {
      const hoje = new Date();
      let dataInicio;
      
      switch (periodo) {
        case 'mes':
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
          break;
        case 'ano':
          dataInicio = new Date(hoje.getFullYear(), 0, 1);
          break;
        default:
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      }
      
      whereClause.dataAplicacao = { [Op.gte]: dataInicio };
    }

    const descontos = await DescontoPagamento.findAll({
      where: whereClause,
      include: [
        { model: Barbeiro, as: 'barbeiro', attributes: ['id', 'nome'] },
        { model: Usuario, as: 'criadoPor', attributes: ['id', 'nome'] }
      ],
      order: [['dataAplicacao', 'DESC']]
    });

    res.json({ descontos });
  } catch (error) {
    console.error('Erro ao buscar descontos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Excluir desconto (apenas se não foi aplicado)
router.delete('/descontos/:id', async (req, res) => {
  try {
    const desconto = await DescontoPagamento.findByPk(req.params.id);
    
    if (!desconto) {
      return res.status(404).json({ message: 'Desconto não encontrado' });
    }

    if (desconto.aplicado) {
      return res.status(400).json({ message: 'Não é possível excluir desconto já aplicado' });
    }

    await desconto.destroy();
    res.json({ message: 'Desconto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir desconto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Dashboard de pagamentos
router.get('/dashboard', async (req, res) => {
  try {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    // Estatísticas gerais
    const totalBarbeiros = await Barbeiro.count({ where: { ativo: true } });
    
    const calculosMes = await CalculoPagamento.findAll({
      where: {
        periodoInicio: { [Op.gte]: inicioMes },
        periodoFim: { [Op.lte]: fimMes }
      }
    });

    const totalComissoesMes = calculosMes.reduce((sum, c) => sum + parseFloat(c.totalAPagar), 0);
    const totalPagoMes = calculosMes.filter(c => c.pago).reduce((sum, c) => sum + parseFloat(c.valorLiquido), 0);
    const totalPendenteMes = calculosMes.filter(c => !c.pago).reduce((sum, c) => sum + parseFloat(c.valorLiquido), 0);

    // Top performers
    const topPerformers = await CalculoPagamento.findAll({
      where: {
        periodoInicio: { [Op.gte]: inicioMes },
        periodoFim: { [Op.lte]: fimMes }
      },
      include: [{
        model: Barbeiro,
        as: 'barbeiro',
        attributes: ['id', 'nome']
      }],
      order: [['totalVendas', 'DESC']],
      limit: 5
    });

    // Pagamentos pendentes
    const pagamentosPendentes = await CalculoPagamento.findAll({
      where: {
        pago: false,
        periodoFim: { [Op.lte]: hoje }
      },
      include: [{
        model: Barbeiro,
        as: 'barbeiro',
        attributes: ['id', 'nome']
      }],
      order: [['periodoFim', 'ASC']]
    });

    res.json({
      estatisticas: {
        totalBarbeiros,
        totalComissoesMes,
        totalPagoMes,
        totalPendenteMes,
        percentualPago: totalComissoesMes > 0 ? (totalPagoMes / totalComissoesMes) * 100 : 0
      },
      topPerformers,
      pagamentosPendentes: pagamentosPendentes.slice(0, 10)
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;