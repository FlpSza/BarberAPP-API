const sequelize = require('../config/database');

// Importar todos os modelos
const Usuario = require('./Usuario');
const Cliente = require('./Cliente');
const Barbeiro = require('./Barbeiro');
const Servico = require('./Servico');
const Agendamento = require('./Agendamento');
const Produto = require('./Produto');
const Venda = require('./Venda');
const VendaItem = require('./VendaItem');
const ConfiguracaoPagamento = require('./ConfiguracaoPagamento');
const CalculoPagamento = require('./CalculoPagamento');
const DescontoPagamento = require('./DescontoPagamento');

// Definir relacionamentos
// Usuario -> Barbeiro
Usuario.hasOne(Barbeiro, { foreignKey: 'usuarioId', as: 'barbeiro' });
Barbeiro.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

// Cliente -> Agendamentos
Cliente.hasMany(Agendamento, { foreignKey: 'clienteId', as: 'agendamentos' });
Agendamento.belongsTo(Cliente, { foreignKey: 'clienteId', as: 'cliente' });

// Barbeiro -> Agendamentos
Barbeiro.hasMany(Agendamento, { foreignKey: 'barbeiroId', as: 'agendamentos' });
Agendamento.belongsTo(Barbeiro, { foreignKey: 'barbeiroId', as: 'barbeiro' });

// Servico -> Agendamentos
Servico.hasMany(Agendamento, { foreignKey: 'servicoId', as: 'agendamentos' });
Agendamento.belongsTo(Servico, { foreignKey: 'servicoId', as: 'servico' });

// Cliente -> Vendas
Cliente.hasMany(Venda, { foreignKey: 'clienteId', as: 'vendas' });
Venda.belongsTo(Cliente, { foreignKey: 'clienteId', as: 'cliente' });

// Barbeiro -> Vendas
Barbeiro.hasMany(Venda, { foreignKey: 'barbeiroId', as: 'vendas' });
Venda.belongsTo(Barbeiro, { foreignKey: 'barbeiroId', as: 'barbeiro' });

// Venda -> VendaItens
Venda.hasMany(VendaItem, { foreignKey: 'vendaId', as: 'itens' });
VendaItem.belongsTo(Venda, { foreignKey: 'vendaId', as: 'venda' });

// Produto -> VendaItens
Produto.hasMany(VendaItem, { foreignKey: 'produtoId', as: 'vendaItens' });
VendaItem.belongsTo(Produto, { foreignKey: 'produtoId', as: 'produto' });

// Servico -> VendaItens
Servico.hasMany(VendaItem, { foreignKey: 'servicoId', as: 'vendaItens' });
VendaItem.belongsTo(Servico, { foreignKey: 'servicoId', as: 'servico' });

// Barbeiro -> ConfiguracaoPagamento
Barbeiro.hasMany(ConfiguracaoPagamento, { foreignKey: 'barbeiroId', as: 'configuracoesPagamento' });
ConfiguracaoPagamento.belongsTo(Barbeiro, { foreignKey: 'barbeiroId', as: 'barbeiro' });

// Barbeiro -> CalculoPagamento
Barbeiro.hasMany(CalculoPagamento, { foreignKey: 'barbeiroId', as: 'calculosPagamento' });
CalculoPagamento.belongsTo(Barbeiro, { foreignKey: 'barbeiroId', as: 'barbeiro' });

// Barbeiro -> DescontoPagamento
Barbeiro.hasMany(DescontoPagamento, { foreignKey: 'barbeiroId', as: 'descontosPagamento' });
DescontoPagamento.belongsTo(Barbeiro, { foreignKey: 'barbeiroId', as: 'barbeiro' });

// CalculoPagamento -> DescontoPagamento
CalculoPagamento.hasMany(DescontoPagamento, { foreignKey: 'calculoPagamentoId', as: 'descontos' });
DescontoPagamento.belongsTo(CalculoPagamento, { foreignKey: 'calculoPagamentoId', as: 'calculo' });

// Usuario -> DescontoPagamento (createdBy)
Usuario.hasMany(DescontoPagamento, { foreignKey: 'createdBy', as: 'descontosCriados' });
DescontoPagamento.belongsTo(Usuario, { foreignKey: 'createdBy', as: 'criadoPor' });
module.exports = {
  sequelize,
  Usuario,
  Cliente,
  Barbeiro,
  Servico,
  Agendamento,
  Produto,
  Venda,
  VendaItem,
  ConfiguracaoPagamento,
  CalculoPagamento,
  DescontoPagamento
};