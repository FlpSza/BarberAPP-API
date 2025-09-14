const express = require('express');
const { body, validationResult } = require('express-validator');
const { Agendamento, Cliente, Barbeiro, Servico } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();
router.use(authenticateToken);

// Listar agendamentos
router.get('/', async (req, res) => {
  try {
    const { data, status, barbeiroId } = req.query;
    
    let whereClause = {};
    
    if (data) {
      whereClause.dataAgendamento = data;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (barbeiroId) {
      whereClause.barbeiroId = barbeiroId;
    }

    const agendamentos = await Agendamento.findAll({
      where: whereClause,
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'nome', 'telefone'] },
        { model: Barbeiro, as: 'barbeiro', attributes: ['id', 'nome'] },
        { model: Servico, as: 'servico', attributes: ['id', 'nome', 'preco', 'duracaoMinutos'] }
      ],
      order: [['dataAgendamento', 'ASC'], ['horario', 'ASC']]
    });

    res.json({ agendamentos });
  } catch (error) {
    console.error('Erro ao buscar agendamentos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Agendamentos de hoje
router.get('/hoje', async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    
    const agendamentos = await Agendamento.findAll({
      where: { dataAgendamento: hoje },
      include: [
        { model: Cliente, as: 'cliente', attributes: ['id', 'nome'] },
        { model: Barbeiro, as: 'barbeiro', attributes: ['id', 'nome'] },
        { model: Servico, as: 'servico', attributes: ['id', 'nome', 'preco'] }
      ],
      order: [['horario', 'ASC']]
    });

    res.json(agendamentos);
  } catch (error) {
    console.error('Erro ao buscar agendamentos de hoje:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar agendamento
router.post('/', [
  body('clienteId').isInt().withMessage('Cliente é obrigatório'),
  body('barbeiroId').isInt().withMessage('Barbeiro é obrigatório'),
  body('servicoId').isInt().withMessage('Serviço é obrigatório'),
  body('dataAgendamento').isDate().withMessage('Data inválida'),
  body('horario').matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).withMessage('Horário inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    // Verificar conflitos de horário
    const { dataAgendamento, horario, barbeiroId } = req.body;
    
    const conflito = await Agendamento.findOne({
      where: {
        dataAgendamento,
        horario,
        barbeiroId,
        status: { [Op.not]: 'cancelado' }
      }
    });

    if (conflito) {
      return res.status(400).json({ 
        message: 'Já existe um agendamento para este barbeiro neste horário' 
      });
    }

    const agendamento = await Agendamento.create(req.body);
    
    // Buscar agendamento criado com relacionamentos
    const agendamentoCompleto = await Agendamento.findByPk(agendamento.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Barbeiro, as: 'barbeiro' },
        { model: Servico, as: 'servico' }
      ]
    });

    res.status(201).json(agendamentoCompleto);
  } catch (error) {
    console.error('Erro ao criar agendamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar status do agendamento
router.patch('/:id/status', [
  body('status').isIn(['agendado', 'em_andamento', 'concluido', 'cancelado'])
    .withMessage('Status inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: errors.array() 
      });
    }

    const [updated] = await Agendamento.update(
      { status: req.body.status },
      { where: { id: req.params.id } }
    );

    if (updated) {
      const agendamento = await Agendamento.findByPk(req.params.id, {
        include: [
          { model: Cliente, as: 'cliente' },
          { model: Barbeiro, as: 'barbeiro' },
          { model: Servico, as: 'servico' }
        ]
      });
      res.json(agendamento);
    } else {
      res.status(404).json({ message: 'Agendamento não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar agendamento
router.put('/:id', async (req, res) => {
  try {
    const [updated] = await Agendamento.update(req.body, {
      where: { id: req.params.id }
    });

    if (updated) {
      const agendamento = await Agendamento.findByPk(req.params.id, {
        include: [
          { model: Cliente, as: 'cliente' },
          { model: Barbeiro, as: 'barbeiro' },
          { model: Servico, as: 'servico' }
        ]
      });
      res.json(agendamento);
    } else {
      res.status(404).json({ message: 'Agendamento não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao atualizar agendamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Excluir agendamento
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Agendamento.destroy({
      where: { id: req.params.id }
    });

    if (deleted) {
      res.json({ message: 'Agendamento excluído com sucesso' });
    } else {
      res.status(404).json({ message: 'Agendamento não encontrado' });
    }
  } catch (error) {
    console.error('Erro ao excluir agendamento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;