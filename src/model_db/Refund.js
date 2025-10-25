import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Refund extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    idRefund: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    refundStatus: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    refundDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    idTicket: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Ticket',
        key: 'idTicket'
      },
      unique: "Refund_idTicket_key"
    }
  }, {
    sequelize,
    tableName: 'Refund',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "Refund_idTicket_key",
        unique: true,
        fields: [
          { name: "idTicket" },
        ]
      },
      {
        name: "Refund_pkey",
        unique: true,
        fields: [
          { name: "idRefund" },
        ]
      },
    ]
  });
  }
}
