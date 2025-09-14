const express = require('express');
const { body, validationResult } = require('express-validator');
const { Venda, VendaItem, Cliente, Barbeiro, Produto, Servico } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();
router.use(authenticateToken);

// Listar vendas
router.get('/', async (req, res) => {
  try {
    const { data } = req.query;
    
    let whereClause = {};
    
    if (data) {
      const startDate = new Date(data + 'T00:00:00');
      const endDate = new Date(data + 'T23:59:59');
      
      whereClause.dataVenda = {
        [Op.between]: [startDate, endDate]
      };
    }

    const vendas = await Venda.findAll({
      where: whereClause,
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'nome'] },
        { model: Barbeiro, as: 'barbeiro', attributes: ['id', 'nome'] },
        {
          model: VendaItem,
          as: 'itens',
          include: [
            { model: Produto, as: 'produto', attributes: ['id', 'nome'] },
            { model: Servico, as: 'servico', attributes: ['id', 'nome'] }
          ]
        }
      ],
      order: [['dataVenda', 'DESC']]
    });

    res.json({ vendas });
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Vendas do mês atual
router.get('/mes-atual', async (req, res) => {
  try {
    const hoje = new Date();
    const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const vendas = await Venda.findAll({
      where: {
        dataVenda: {
          [Op.between]: [primeiroDiaMes, ultimoDiaMes]
        }
      }
    });

    const total = vendas.reduce((sum, venda) => sum + parseFloat(venda.total), 0);

    res.json({ total, quantidade: vendas.length });
  } catch (error) {
    console.error('Erro ao buscar vendas do mês:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar venda
router.post('/', [
  body('total').isFloat({ min: 0.01 }).withMessage('Total deve ser maior que zero'),
  body('formaPagamento').isIn(['dinheiro', 'cartao_debito', 'cartao_credito', 'pix'])
    .withMessage('Forma de pagamento inválida'),
  body('itens').isArray({ min: 1 }).withMessage('Deve haver pelo menos um item')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const { itens, ...vendaData } = req.body;

    // Criar venda
    const venda = await Venda.create(vendaData);

    // Criar itens da venda
    const itensComVendaId = itens.map(item => {
      const novoItem = {
        vendaId: venda.id,
        produtoId: item.tipo === 'produto' ? item.id : null,
        servicoId: item.tipo === 'servico' ? item.id : null,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        subtotal: item.quantidade * parseFloat(item.preco_unitario)
      };
      return novoItem;
    });

    await VendaItem.bulkCreate(itensComVendaId);

    // Atualizar estoque dos produtos
    for (const item of itens) {
      if (item.tipo === 'produto') {
        await Produto.decrement('estoque', {
          by: item.quantidade,
          where: { id: item.id }
        });
      }
    }

    // Buscar venda completa
    const vendaCompleta = await Venda.findByPk(venda.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Barbeiro, as: 'barbeiro' },
        {
          model: VendaItem,
          as: 'itens',
          include: [
            { model: Produto, as: 'produto' },
            { model: Servico, as: 'servico' }
          ]
        }
      ]
    });

    res.status(201).json(vendaCompleta);
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;