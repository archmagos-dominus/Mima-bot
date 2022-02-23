module.exports = (sequelize, DataTypes) => {
  return sequelize.define('waifus', {
    waifu_id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    owner_id: DataTypes.STRING,
    value: {
      type: DataTypes.INTEGER,
      defaultValue: 2500
    }
  });
};
