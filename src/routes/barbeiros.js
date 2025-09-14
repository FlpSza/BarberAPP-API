const express = require('express');
const { body, validationResult } = require('express-validator');
const { Barbeiro, Usuario } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticateToken);

// Listar barbeiros
router.get('/', async (req, res) => {
  try {
    const barbeiros = await Barbeiro.findAll({
      where: { ativo: true },
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: { exclude: ['senha'] }
      }],
      order: [['nome', 'ASC']]
    });

    res.json({ barbeiros });
  } catch (error) {
    console.error('Erro ao buscar barbeiros:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar barbeiro por ID
router.get('/:id', async (req, res) => {
  try {
    const barbeiro = await Barbeiro.findByPk(req.params.id, {
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: { exclude: ['senha'] }
      }]
    });

    if (!barbeiro) {
      return res.status(404).json({ message: 'Barbeiro não encontrado' });
    }

    res.json(barbeiro);
  } catch (error) {
    console.error('Erro ao buscar barbeiro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar barbeiro
router.post('/', [
  body('nome').isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
  body('telefone').optional().isMobilePhone('pt-BR').withMessage('Telefone inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const barbeiro = await Barbeiro.create(req.body);
    res.status(201).json(barbeiro);
  } catch (error) {
    console.error('Erro ao criar barbeiro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar barbeiro
router.put('/:id', [
  body('nome').optional().isLength({ min: 2 }).withMessage('Nome deve ter pelo menos 2 caracteres'),
  body('telefone').optional().isMobilePhone('pt-BR').withMessage('Telefone inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const [updated] = await Barbeiro.update(req.body, {
      where: { id: req.params.id }
    });

    if (updated) {
      const barbeiro = await Barbeiro.findByPk(req.params.id);
      res.json(barbeiro);
    } else {
      res.status(404).json({ message: 'Barbeiro não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar barbeiro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Excluir barbeiro (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const [updated] = await Barbeiro.update(
      { ativo: false },
      { where: { id: req.params.id } }
    );

    if (updated) {
      res.json({ message: 'Barbeiro excluído com sucesso' });
    } else {
      res.status(404).json({ message: 'Barbeiro não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao excluir barbeiro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;