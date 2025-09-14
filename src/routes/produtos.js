const express = require('express');
const { body, validationResult } = require('express-validator');
const { Produto } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Listar produtos
router.get('/', async (req, res) => {
  try {
    const produtos = await Produto.findAll({
      where: { ativo: true },
      order: [['nome', 'ASC']]
    });

    res.json({ produtos });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar produto
router.post('/', [
  body('nome').isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
  body('preco').isFloat({ min: 0.01 }).withMessage('Preço deve ser maior que zero'),
  body('estoque').isInt({ min: 0 }).withMessage('Estoque não pode ser negativo'),
  body('estoqueMinimo').isInt({ min: 0 }).withMessage('Estoque mínimo não pode ser negativo')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const produto = await Produto.create(req.body);
    res.status(201).json(produto);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar produto
router.put('/:id', async (req, res) => {
  try {
    const [updated] = await Produto.update(req.body, {
      where: { id: req.params.id }
    });

    if (updated) {
      const produto = await Produto.findByPk(req.params.id);
      res.json(produto);
    } else {
      res.status(404).json({ message: 'Produto não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Excluir produto
router.delete('/:id', async (req, res) => {
  try {
    const [updated] = await Produto.update(
      { ativo: false },
      { where: { id: req.params.id } }
    );

    if (updated) {
      res.json({ message: 'Produto excluído com sucesso' });
    } else {
      res.status(404).json({ message: 'Produto não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;