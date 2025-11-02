import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class card extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    card_id: {
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
      unique: "card_payment_method_id_key"
    },
    card_token: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    card_brand: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    last4: {
      type: DataTypes.CHAR(4),
      allowNull: false
    },
    exp_month: {
      type: DataTypes.SMALLINT,
      allowNull: false
    },
    exp_year: {
      type: DataTypes.SMALLINT,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'card',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "card_payment_method_id_key",
        unique: true,
        fields: [
          { name: "payment_method_id" },
        ]
      },
      {
        name: "card_pkey",
        unique: true,
        fields: [
          { name: "card_id" },
        ]
      },
    ]
  });
  }
}
