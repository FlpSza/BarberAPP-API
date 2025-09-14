const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConfiguracaoPagamento = sequelize.define('ConfiguracaoPagamento', {
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
  tipoComissao: {
    type: DataTypes.ENUM('porcentagem', 'valor_fixo', 'aluguel_cadeira'),
    defaultValue: 'porcentagem',
    field: 'tipo_comissao'
  },
  porcentagemServicos: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 50.00,
    field: 'porcentagem_servicos'
  },
  porcentagemProdutos: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 30.00,
    field: 'porcentagem_produtos'
  },
  valorAluguelCadeira: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'valor_aluguel_cadeira'
  },
  valorFixoMensal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'valor_fixo_mensal'
  },
  metaMensal: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'meta_mensal'
  },
  bonusMeta: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    field: 'bonus_meta'
  },
  dataInicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'data_inicio'
  },
  dataFim: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'data_fim'
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'configuracoes_pagamento',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

module.exports = ConfiguracaoPagamento;