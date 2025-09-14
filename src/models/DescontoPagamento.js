const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DescontoPagamento = sequelize.define('DescontoPagamento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  barbeiroId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'barbeiro_id'
  },
  calculoPagamentoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'calculo_pagamento_id'
  },
  tipo: {
    type: DataTypes.ENUM('desconto', 'adiantamento', 'bonus', 'multa'),
    allowNull: false
  },
  descricao: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  valor: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  dataAplicacao: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'data_aplicacao'
  },
  aplicado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'created_by'
  }
}, {
  tableName: 'descontos_pagamento',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true
});

module.exports = DescontoPagamento;