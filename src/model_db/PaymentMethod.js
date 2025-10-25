import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class PaymentMethod extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    idPaymentMethod: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    cvv: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    expirationDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    cardHolderName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    cardNumber: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    idAttendee: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Attendee',
        key: 'idAttendee'
      }
    }
  }, {
    sequelize,
    tableName: 'PaymentMethod',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "PaymentMethod_pkey",
        unique: true,
        fields: [
          { name: "idPaymentMethod" },
        ]
      },
    ]
  });
  }
}
