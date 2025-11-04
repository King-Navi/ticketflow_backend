import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class event_image extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    event_image_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'event',
        key: 'event_id'
      }
    },
    event_image_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'event_image_type',
        key: 'event_image_type_id'
      }
    },
    image_path: {
      type: DataTypes.STRING(300),
      allowNull: false
    },
    alt_text: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'event_image',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "event_image_pkey",
        unique: true,
        fields: [
          { name: "event_image_id" },
        ]
      },
      {
        name: "idx_event_image_event_id",
        fields: [
          { name: "event_id" },
        ]
      },
      {
        name: "idx_event_image_type_id",
        fields: [
          { name: "event_image_type_id" },
        ]
      },
    ]
  });
  }
}
