import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class check_in_status extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    check_in_status_id: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      primaryKey: true
    },
    status_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "check_in_status_status_name_key"
    }
  }, {
    sequelize,
    tableName: 'check_in_status',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "check_in_status_pkey",
        unique: true,
        fields: [
          { name: "check_in_status_id" },
        ]
      },
      {
        name: "check_in_status_status_name_key",
        unique: true,
        fields: [
          { name: "status_name" },
        ]
      },
    ]
  });
  }
}
