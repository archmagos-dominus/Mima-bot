const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const CurrencyShop = require('./models/CurrencyShop')(sequelize, Sequelize.DataTypes);
require('./models/Users')(sequelize, Sequelize.DataTypes);
require('./models/UserItems')(sequelize, Sequelize.DataTypes);
require('./models/PlantedCurrency')(sequelize, Sequelize.DataTypes);
require('./models/Waifus')(sequelize, Sequelize.DataTypes);
require('./models/WaifuItems')(sequelize, Sequelize.DataTypes);
require('./models/Transactions')(sequelize, Sequelize.DataTypes);

const force = process.argv.includes('--force') || process.argv.includes('-f');

sequelize.sync({ force }).then(async () => {
	const shop = [
		CurrencyShop.upsert({ name: 'Interesting', cost: 10000, desc: 'Grants "Interesting" role and access to hobby/interests cathegory' }),
		CurrencyShop.upsert({ name: 'Insane', cost: 10000, desc: 'Grants "Insane" role and access to "certain" channels that arebad for your mental capacity and wellbeing' }),
		CurrencyShop.upsert({ name: 'Horni', cost: 20000, desc: 'Grants "Horni" role and access to NSFW channels' }),
		CurrencyShop.upsert({ name: 'Purple Marisa', cost: 100000, desc: 'Gives "Purple Marisa" role and acces to unique Mima-bot commands' }),
	];
	await Promise.all(shop);
	console.log('Database synced');
	sequelize.close();
}).catch(console.error);
