import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Ticket extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    idTicket: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    seatNumber: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    unitPrice: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    qrCode: {
      type: DataTypes.BLOB,
      allowNull: false
    },
    idSeat: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Seat',
        key: 'idSeat'
      }
    },
    idPayment: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Payment',
        key: 'idPayment'
      }
    }
  }, {
    sequelize,
    tableName: 'Ticket',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "Ticket_pkey",
        unique: true,
        fields: [
          { name: "idTicket" },
        ]
      },
    ]
  });
  }
}
