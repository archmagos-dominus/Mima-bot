module.exports = (sequelize, DataTypes) => {
  return sequelize.define('waifu_item', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // foreign key to user
    waifu_id: DataTypes.STRING,
    name: DataTypes.STRING,
    cost: DataTypes.INTEGER
  });
};
