import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class seat extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    seat_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    seat_no: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    row_no: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    section_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'section',
        key: 'section_id'
      }
    }
  }, {
    sequelize,
    tableName: 'seat',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "idx_seat_section_id",
        fields: [
          { name: "section_id" },
        ]
      },
      {
        name: "seat_pkey",
        unique: true,
        fields: [
          { name: "seat_id" },
        ]
      },
      {
        name: "uq_seat_in_section_ci",
        unique: true,
        fields: [
          { name: "section_id" },
        ]
      },
    ]
  });
  }
}
