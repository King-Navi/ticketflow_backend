import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Payment extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    idPayment: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    taxPercentage: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    ticketQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    idPaymentMethod: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'PaymentMethod',
        key: 'idPaymentMethod'
      }
    },
    idReservation: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Reservation',
        key: 'idReservation'
      }
    }
  }, {
    sequelize,
    tableName: 'Payment',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "Payment_pkey",
        unique: true,
        fields: [
          { name: "idPayment" },
        ]
      },
    ]
  });
  }
}
