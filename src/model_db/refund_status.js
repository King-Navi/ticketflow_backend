import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class refund_status extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    refund_status_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    status_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "refund_status_status_name_key"
    }
  }, {
    sequelize,
    tableName: 'refund_status',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "refund_status_pkey",
        unique: true,
        fields: [
          { name: "refund_status_id" },
        ]
      },
      {
        name: "refund_status_status_name_key",
        unique: true,
        fields: [
          { name: "status_name" },
        ]
      },
    ]
  });
  }
}
