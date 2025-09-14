const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Barbeiro = sequelize.define('Barbeiro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  telefone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  especialidades: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  horarioInicio: {
    type: DataTypes.TIME,
    defaultValue: '08:00:00'
  },
  horarioFim: {
    type: DataTypes.TIME,
    defaultValue: '18:00:00'
  },
  diasTrabalho: {
    type: DataTypes.JSON,
    defaultValue: ['seg', 'ter', 'qua', 'qui', 'sex', 'sab']
  },
  dataContratacao: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'barbeiros',
  timestamps: false
});

module.exports = Barbeiro;