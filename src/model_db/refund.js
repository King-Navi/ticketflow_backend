import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class refund extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    refund_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    refund_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    refund_amount: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ticket',
        key: 'ticket_id'
      },
      unique: "refund_ticket_id_key"
    },
    refund_status_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'refund_status',
        key: 'refund_status_id'
      }
    }
  }, {
    sequelize,
    tableName: 'refund',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "idx_refund_refund_status_id",
        fields: [
          { name: "refund_status_id" },
        ]
      },
      {
        name: "idx_refund_ticket_id",
        fields: [
          { name: "ticket_id" },
        ]
      },
      {
        name: "refund_pkey",
        unique: true,
        fields: [
          { name: "refund_id" },
        ]
      },
      {
        name: "refund_ticket_id_key",
        unique: true,
        fields: [
          { name: "ticket_id" },
        ]
      },
    ]
  });
  }
}
