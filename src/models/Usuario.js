const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  senha: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('admin', 'barbeiro', 'cliente'),
    defaultValue: 'cliente'
  },
  telefone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'data_criacao',
  updatedAt: false
});

module.exports = Usuario;