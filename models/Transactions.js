// TODO: curtrs

module.exports = (sequelize, DataTypes) => {
  return sequelize.define('currency_transaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: DataTypes.STRING,
    amount: DataTypes.INTEGER,
    reason: DataTypes.STRING
  });
};
