const express = require('express');
const { body, validationResult } = require('express-validator');
const { Servico } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Listar serviços
router.get('/', async (req, res) => {
  try {
    const servicos = await Servico.findAll({
      where: { ativo: true },
      order: [['nome', 'ASC']]
    });

    res.json({ servicos });
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar serviço
router.post('/', [
  body('nome').isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
  body('preco').isFloat({ min: 0.01 }).withMessage('Preço deve ser maior que zero'),
  body('duracaoMinutos').isInt({ min: 1 }).withMessage('Duração deve ser maior que zero')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const servico = await Servico.create(req.body);
    res.status(201).json(servico);
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar serviço
router.put('/:id', async (req, res) => {
  try {
    const [updated] = await Servico.update(req.body, {
      where: { id: req.params.id }
    });

    if (updated) {
      const servico = await Servico.findByPk(req.params.id);
      res.json(servico);
    } else {
      res.status(404).json({ message: 'Serviço não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Excluir serviço
router.delete('/:id', async (req, res) => {
  try {
    const [updated] = await Servico.update(
      { ativo: false },
      { where: { id: req.params.id } }
    );

    if (updated) {
      res.json({ message: 'Serviço excluído com sucesso' });
    } else {
      res.status(404).json({ message: 'Serviço não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao excluir serviço:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;