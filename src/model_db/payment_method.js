import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class payment_method extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    payment_method_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    attendee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'attendee',
        key: 'attendee_id'
      }
    }
  }, {
    sequelize,
    tableName: 'payment_method',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "payment_method_pkey",
        unique: true,
        fields: [
          { name: "payment_method_id" },
        ]
      },
    ]
  });
  }
}
