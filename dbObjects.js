const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  logging: false,
  storage: 'database.sqlite',
});

const Users = require('./models/Users')(sequelize, Sequelize.DataTypes);
const CurrencyShop = require('./models/CurrencyShop')(sequelize, Sequelize.DataTypes);
const UserItems = require('./models/UserItems')(sequelize, Sequelize.DataTypes);

const PlantedCurrency = require('./models/PlantedCurrency')(sequelize, Sequelize.DataTypes);
const Waifus = require('./models/Waifus')(sequelize, Sequelize.DataTypes);
const WaifuItems = require('./models/WaifuItems')(sequelize, Sequelize.DataTypes);
const Transactions = require('./models/Transactions')(sequelize, Sequelize.DataTypes);

UserItems.belongsTo(CurrencyShop, { foreignKey: 'item_id', as: 'item' });

Users.hasOne(Waifus, { foreignKey: 'waifu_id', as: 'waifuinfo' });
Users.hasMany(Waifus, { foreignKey: 'owner_id', as: 'waifus' });
Users.hasMany(WaifuItems, { foreignKey: 'waifu_id', as: 'gifts' });

Waifus.belongsTo(Users, { foreignKey: 'owner_id', as: 'owner' });
Waifus.belongsTo(Users, { foreignKey: 'waifu_id', as: 'waifu' });

Reflect.defineProperty(Users.prototype, 'getWaifus', {
  value: async function() {
    return Waifus.findAll({
      where: { owner_id: this.user_id },
      include: ['waifu']
    });
  }
});

Reflect.defineProperty(Users.prototype, 'getGifts', {
  value: async function() {
    return WaifuItems.findAll({
      where: { waifu_id: this.user_id },
      attributes: [
        'name',
        [sequelize.fn('sum', sequelize.col('cost')), 'total'],
        [sequelize.fn('COUNT', 'name'), 'count']
      ],
      group: ['name'],
      order: [[sequelize.fn('COUNT', 'name'), 'DESC']],
      raw: true
    });
  }
});

Reflect.defineProperty(Users.prototype, 'transaction', {
  value: async function(amount, reason) {
    return Transactions.create({
      user_id: this.user_id, amount: amount, reason: reason
    });
  }
});

Reflect.defineProperty(Users.prototype, 'plant', {
  value: async function(amount, password) {
    return PlantedCurrency.create({ amount: amount, password: password });
  }
});

Reflect.defineProperty(Users.prototype, 'pick', {
  value: async function(password) {
    return PlantedCurrency.destroy({ where: { password: password } });
  }
});

Users.prototype.addItem = async function(item) {
  const userItem = await UserItems.findOne({
    where: { user_id: this.user_id, item_id: item.id },
  });

  if (userItem) {
    userItem.amount += 1;
    return userItem.save();
  }

  return UserItems.create({ user_id: this.user_id, item_id: item.id, amount: 1 });
};

Users.prototype.getItems = function() {
  return UserItems.findAll({
    where: { user_id: this.user_id },
    include: ['item'],
  });
};

module.exports = {
  Users, CurrencyShop, UserItems, PlantedCurrency, Waifus, WaifuItems, Transactions
};
