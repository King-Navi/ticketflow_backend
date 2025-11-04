import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class event_image_type extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    event_image_type_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: "event_image_type_code_key"
    },
    description: {
      type: DataTypes.STRING(150),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'event_image_type',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "event_image_type_code_key",
        unique: true,
        fields: [
          { name: "code" },
        ]
      },
      {
        name: "event_image_type_pkey",
        unique: true,
        fields: [
          { name: "event_image_type_id" },
        ]
      },
    ]
  });
  }
}
