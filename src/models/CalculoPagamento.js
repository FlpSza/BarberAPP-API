const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CalculoPagamento = sequelize.define('CalculoPagamento', {
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
  periodoInicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'periodo_inicio'
  },
  periodoFim: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'periodo_fim'
  },
  totalVendas: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'total_vendas'
  },
  totalServicos: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'total_servicos'
  },
  totalProdutos: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'total_produtos'
  },
  comissaoServicos: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'comissao_servicos'
  },
  comissaoProdutos: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'comissao_produtos'
  },
  valorAluguel: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'valor_aluguel'
  },
  bonusMeta: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'bonus_meta'
  },
  totalAPagar: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'total_a_pagar'
  },
  descontoTotal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'desconto_total'
  },
  valorLiquido: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'valor_liquido'
  },
  pago: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  dataPagamento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'data_pagamento'
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'calculos_pagamento',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = CalculoPagamento;