const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Produto = sequelize.define('Produto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  preco: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  estoque: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  estoqueMinimo: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  categoria: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'produtos',
  timestamps: false
});

module.exports = Produto;