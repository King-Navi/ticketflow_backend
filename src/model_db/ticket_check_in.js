import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class ticket_check_in extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    ticket_check_in_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    ticket_qr_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'ticket_qr',
        key: 'ticket_qr_id'
      }
    },
    check_in_status_id: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      references: {
        model: 'check_in_status',
        key: 'check_in_status_id'
      }
    },
    scanned_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now')
    },
    scanner_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'ticket_check_in',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "idx_check_in_qr_id",
        fields: [
          { name: "ticket_qr_id" },
        ]
      },
      {
        name: "idx_check_in_scanned",
        fields: [
          { name: "scanned_at" },
        ]
      },
      {
        name: "idx_check_in_status_id",
        fields: [
          { name: "check_in_status_id" },
        ]
      },
      {
        name: "ticket_check_in_pkey",
        unique: true,
        fields: [
          { name: "ticket_check_in_id" },
        ]
      },
    ]
  });
  }
}
