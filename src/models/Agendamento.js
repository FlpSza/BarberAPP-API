const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Agendamento = sequelize.define('Agendamento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  barbeiroId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  servicoId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  dataAgendamento: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  horario: {
    type: DataTypes.TIME,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('agendado', 'em_andamento', 'concluido', 'cancelado'),
    defaultValue: 'agendado'
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'agendamentos',
  timestamps: true,
  createdAt: 'data_criacao',
  updatedAt: 'dataAtualizacao'
});

module.exports = Agendamento;