import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class payment extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    payment_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    purchase_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    subtotal: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    tax_percentage: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    tax_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    total_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    ticket_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    attendee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'attendee',
        key: 'attendee_id'
      }
    },
    stripe_payment_intent_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "payment_stripe_payment_intent_id_key"
    }
  }, {
    sequelize,
    tableName: 'payment',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "idx_payment_attendee_id",
        fields: [
          { name: "attendee_id" },
        ]
      },
      {
        name: "payment_pkey",
        unique: true,
        fields: [
          { name: "payment_id" },
        ]
      },
      {
        name: "payment_stripe_payment_intent_id_key",
        unique: true,
        fields: [
          { name: "stripe_payment_intent_id" },
        ]
      },
      {
        name: "uq_payment_stripe_pi",
        unique: true,
        fields: [
          { name: "stripe_payment_intent_id" },
        ]
      },
    ]
  });
  }
}
