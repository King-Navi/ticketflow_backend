import _sequelize from 'sequelize';
const { Model, Sequelize } = _sequelize;

export default class Company extends Model {
  static init(sequelize, DataTypes) {
  return super.init({
    idCompany: {
      autoIncrement: true,
      autoIncrementIdentity: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    companyName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    taxId: {
      type: DataTypes.STRING(100),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'Company',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "Company_pkey",
        unique: true,
        fields: [
          { name: "idCompany" },
        ]
      },
    ]
  });
  }
}
