import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class crypto_payment extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    crypto_payment_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    payment_method_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'payment_method',
        key: 'payment_method_id'
      },
      unique: "crypto_payment_payment_method_id_key"
    },
    wallet_address: {
      type: DataTypes.STRING(300),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'crypto_payment',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "crypto_payment_payment_method_id_key",
        unique: true,
        fields: [
          { name: "payment_method_id" },
        ]
      },
      {
        name: "crypto_payment_pkey",
        unique: true,
        fields: [
          { name: "crypto_payment_id" },
        ]
      },
    ]
  });
  }
}
