const express = require('express');
const { body, validationResult } = require('express-validator');
const { Cliente } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Listar clientes
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { nome: { [Op.like]: `%${search}%` } },
        { telefone: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Cliente.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['nome', 'ASC']]
    });

    res.json({
      clientes: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar cliente por ID
router.get('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.findByPk(req.params.id);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar cliente
router.post('/', [
  body('nome').isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
  body('telefone').isMobilePhone('pt-BR').withMessage('Telefone inválido'),
  body('email').optional().isEmail().withMessage('Email inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const cliente = await Cliente.create(req.body);
    res.status(201).json(cliente);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Email já está em uso' });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar cliente
router.put('/:id', [
  body('nome').optional().isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
  body('telefone').optional().isMobilePhone('pt-BR').withMessage('Telefone inválido'),
  body('email').optional().isEmail().withMessage('Email inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const [updated] = await Cliente.update(req.body, {
      where: { id: req.params.id }
    });

    if (updated) {
      const cliente = await Cliente.findByPk(req.params.id);
      res.json(cliente);
    } else {
      res.status(404).json({ message: 'Cliente não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Excluir cliente (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const [updated] = await Cliente.update(
      { ativo: false },
      { where: { id: req.params.id } }
    );

    if (updated) {
      res.json({ message: 'Cliente excluído com sucesso' });
    } else {
      res.status(404).json({ message: 'Cliente não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;