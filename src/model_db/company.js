import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class company extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    company_id: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    company_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    tax_id: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'company',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    freezeTableName: true,
    indexes: [
      {
        name: "company_pkey",
        unique: true,
        fields: [
          { name: "company_id" },
        ]
      },
    ]
  });
  }
}
