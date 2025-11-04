import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class section extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    section_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    section_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    event_location_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'event_location',
        key: 'event_location_id'
      }
    }
  }, {
    sequelize,
    tableName: 'section',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "idx_section_event_location_id",
        fields: [
          { name: "event_location_id" },
        ]
      },
      {
        name: "section_pkey",
        unique: true,
        fields: [
          { name: "section_id" },
        ]
      },
      {
        name: "uq_section_in_location_ci",
        unique: true,
        fields: [
          { name: "event_location_id" },
        ]
      },
    ]
  });
  }
}
