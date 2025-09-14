const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Venda = sequelize.define('Venda', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  barbeiroId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  formaPagamento: {
    type: DataTypes.ENUM('dinheiro', 'cartao_debito', 'cartao_credito', 'pix'),
    allowNull: false
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'vendas',
  timestamps: true,
  createdAt: 'dataVenda',
  updatedAt: false
});

module.exports = Venda;