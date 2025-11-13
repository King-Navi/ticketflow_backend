import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class ticket_qr extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    ticket_qr_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    ticket_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ticket',
        key: 'ticket_id'
      }
    },
    token: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      unique: "ticket_qr_token_key"
    }
  }, {
    sequelize,
    tableName: 'ticket_qr',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "idx_ticket_qr_token",
        fields: [
          { name: "token" },
        ]
      },
      {
        name: "ticket_qr_pkey",
        unique: true,
        fields: [
          { name: "ticket_qr_id" },
        ]
      },
      {
        name: "ticket_qr_token_key",
        unique: true,
        fields: [
          { name: "token" },
        ]
      },
      {
        name: "uq_ticket_qr_one_per_ticket",
        unique: true,
        fields: [
          { name: "ticket_id" },
        ]
      },
    ]
  });
  }
}
