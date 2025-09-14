const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VendaItem = sequelize.define('VendaItem', {
  //id: {
  //  type: DataTypes.INTEGER,
  //  primaryKey: true,
  //  autoIncrement: true
  //},
  vendaId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  produtoId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  servicoId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  preco_unitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'venda_itens',
  timestamps: false
});

module.exports = VendaItem;