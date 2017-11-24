'use strict';

const fs = require('fs'),
    path = require('path'),
    Sequelize = require('sequelize'),
    basename = path.basename(__filename),
    env = process.env.NODE_ENV || 'development',
    config = require(__dirname + '/../config/config.json')[env];
let db = {},
    sequelize = null;

if (config.use_env_variable) {
    sequelize = new Sequelize(process.env[config.use_env_variable]);
} else {
    sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        let model = sequelize['import'](path.join(__dirname, file));
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

//  Models
db.user = require('./user')(sequelize, Sequelize);
db.pets = require('./pets/pets')(sequelize, Sequelize);
db.breeds = require('./pets/breeds')(sequelize, Sequelize);
db.species = require('./pets/species')(sequelize, Sequelize);
db.petRelation = require('./pets/petRelation')(sequelize, Sequelize);
db.locations = require('./location/locations')(sequelize, Sequelize);
db.location_type = require('./location/location_type')(sequelize, Sequelize);
db.location_media = require('./location/locationsMedia')(sequelize, Sequelize);
db.locationRatings = require('./location/locationRatings')(sequelize, Sequelize);
db.locationComments = require('./location/locationComments')(sequelize, Sequelize);
db.mpAds = require('./marketplace/mpAds')(sequelize, Sequelize);
db.mpMedia = require('./marketplace/mpMedia')(sequelize, Sequelize);
db.mpSettings = require('./marketplace/mpSettings')(sequelize, Sequelize);
db.lostAndFound = require('./lostAndFound/lostAndFound')(sequelize, Sequelize);
db.lostAndFoundMedia = require('./lostAndFound/l&fMedia')(sequelize, Sequelize);
db.notes = require('./notes')(sequelize, Sequelize);
db.fsBrands = require('./foodStore/fsBrands')(sequelize, Sequelize);
db.fsCategories = require('./foodStore/fsCategories')(sequelize, Sequelize);
db.fsProperties = require('./foodStore/fsProperties')(sequelize, Sequelize);
db.fsPropertyValues = require('./foodStore/fsPropertyValues')(sequelize, Sequelize);
db.fsProducts = require('./foodStore/fsProducts')(sequelize, Sequelize);
db.fsProductsProps = require('./foodStore/fsProductsProps')(sequelize, Sequelize);
db.fsFavouriteProducts = require('./foodStore/fsFavouriteProducts')(sequelize, Sequelize);
db.fsProductRatings = require('./foodStore/fsProductRatings')(sequelize, Sequelize);
db.fsOrders = require('./foodStore/fsOrders')(sequelize, Sequelize);
db.fsOrderProducts = require('./foodStore/fsOrderProducts')(sequelize, Sequelize);
db.feedPosts = require('./feed/post')(sequelize, Sequelize);
db.feedPostMedia = require('./feed/postMedia')(sequelize, Sequelize);
db.feedLikes = require('./feed/likes')(sequelize, Sequelize);
db.feedComments = require('./feed/comments')(sequelize, Sequelize);
db.feedCommentsJunction = require('./feed/commentsJunction')(sequelize, Sequelize);
db.feedCommentLikes = require('./feed/commentLikes')(sequelize, Sequelize);

//  Relations
db.pets.belongsTo(db.user, {as: 'Owner', foreignKey: 'owner_id', targetKey: 'id'});
db.user.hasMany(db.pets);

db.pets.belongsTo(db.breeds, {as: 'Breed', foreignKey: 'breed_id'});
db.pets.belongsTo(db.species, {as: 'Specie', foreignKey: 'specie_id'});
db.breeds.hasMany(db.pets);
db.species.hasMany(db.pets);

db.breeds.belongsTo(db.species, {as: 'Specie', foreignKey: 'specie_id', targetKey: 'id'});
db.species.hasMany(db.breeds);

db.petRelation.belongsTo(db.pets, {as: 'Sender', foreignKey: 'sender_id', targetKey: 'id'});
db.petRelation.belongsTo(db.pets, {as: 'Receiver', foreignKey: 'receiver_id', targetKey: 'id'});

db.pets.hasMany(db.petRelation, {foreignKey: 'sender_id'});
db.pets.hasMany(db.petRelation, {foreignKey: 'receiver_id'});

db.locations.belongsTo(db.location_type, {as: 'Type', foreignKey: 'location_type_id', targetKey: 'id'});
db.location_type.hasMany(db.locations);

db.location_media.belongsTo(db.locations, {as: 'Media', foreignKey: 'location_id', targetKey: 'id'});
db.locations.hasMany(db.location_media);

db.locations.hasMany(db.locationRatings);
db.locationRatings.belongsTo(db.locations, {as: 'Rating', foreignKey: 'locationID', targetKey: 'id'});

db.locationComments.belongsTo(db.locations, {as: 'Location', foreignKey: 'location_id', targetKey: 'id'});
db.locations.hasMany(db.locationComments);

db.locationComments.belongsTo(db.pets, {as: 'PetComment', foreignKey: 'pet_id', targetKey: 'id'});
db.pets.hasMany(db.locationComments);

db.user.hasMany(db.mpAds);
db.mpAds.belongsTo(db.user, {as: 'User', foreignKey: 'userID', targetKey: 'id'});

db.mpAds.hasMany(db.mpMedia);
db.mpMedia.belongsTo(db.mpAds, {as: 'Ad', foreignKey: 'mpAd_id', targetKey: 'id'});

db.lostAndFoundMedia.belongsTo(db.lostAndFound, {as: 'LFMedia', foreignKey: 'ann_id', targetKey: 'id'});
db.lostAndFound.hasMany(db.lostAndFoundMedia);

db.lostAndFound.belongsTo(db.user, {as: 'UserAnn', foreignKey: 'userID', targetKey: 'id'});
db.user.hasMany(db.lostAndFound);

db.lostAndFound.belongsTo(db.breeds, {as: 'BreedAnn', foreignKey: 'breed_id', targetKey: 'id'});
db.breeds.hasMany(db.lostAndFound);

db.lostAndFound.belongsTo(db.species, {as: 'SpecieAnn', foreignKey: 'species_id', targetKey: 'id'});
db.species.hasMany(db.lostAndFound);

db.notes.belongsTo(db.pets, {as: 'NotePet', foreignKey: 'pet_id', targetKey: 'id'});
db.pets.hasMany(db.notes);

db.fsProperties.belongsTo(db.fsCategories, {as: 'Category', foreignKey: 'category_id', targetKey: 'id'});
db.fsCategories.hasMany(db.fsProperties);

db.fsPropertyValues.belongsTo(db.fsProperties, {as: 'Property', foreignKey: 'property_id', targetKey: 'id'});
db.fsProperties.hasMany(db.fsPropertyValues);

db.fsProducts.belongsTo(db.fsBrands, {as: 'fsBrand', foreignKey: 'brand_id', targetKey: 'id'});
db.fsBrands.hasMany(db.fsProducts);

db.fsProducts.belongsTo(db.fsCategories, {as: 'fsCategory', foreignKey: 'category_id', targetKey: 'id'});
db.fsCategories.hasMany(db.fsCategories);

db.fsProductsProps.belongsTo(db.fsProducts, {as: 'Product', foreignKey: 'product_id', targetKey: 'id'});
db.fsProducts.hasMany(db.fsProductsProps);

db.fsProductsProps.belongsTo(db.fsProperties, {as: 'Property', foreignKey: 'property_id', targetKey: 'id'});
db.fsProperties.hasMany(db.fsProductsProps);

db.fsProductsProps.belongsTo(db.fsPropertyValues, {as: 'Value', foreignKey: 'value_id', targetKey: 'id'});
db.fsPropertyValues.hasMany(db.fsProductsProps);

db.fsFavouriteProducts.belongsTo(db.user, {as: 'User', foreignKey: 'user_id', targetKey: 'id'});
db.user.hasMany(db.fsFavouriteProducts);

db.fsFavouriteProducts.belongsTo(db.fsProducts, {as: 'Product', foreignKey: 'product_id', targetKey: 'id'});
db.fsProducts.hasMany(db.fsFavouriteProducts);

db.fsProductRatings.belongsTo(db.user, {as: 'User', foreignKey: 'user_id', targetKey: 'id'});
db.user.hasMany(db.fsProductRatings);

db.fsProductRatings.belongsTo(db.fsProducts, {as: 'Product', foreignKey: 'product_id', targetKey: 'id'});
db.fsProducts.hasMany(db.fsProductRatings);

db.fsOrders.belongsTo(db.user, {as: 'User', foreignKey: 'user_id', targetKey: 'id'});
db.user.hasMany(db.fsOrders);

db.fsOrders.belongsTo(db.fsProducts, {as: 'Product', foreignKey: 'product_id', targetKey: 'id'});
db.fsProducts.hasMany(db.fsOrders);

db.fsOrderProducts.belongsTo(db.fsOrders, {as: 'Order', foreignKey: 'order_id', targetKey: 'id'});
db.fsOrders.hasMany(db.fsOrderProducts);

db.fsOrderProducts.belongsTo(db.fsProducts, {as: 'Product', foreignKey: 'product_id', targetKey: 'id'});
db.fsProducts.hasMany(db.fsOrderProducts);

db.feedPosts.belongsTo(db.pets, {as: 'Pet', foreignKey: 'pet_id'});
db.pets.hasMany(db.feedPosts);

db.feedPostMedia.belongsTo(db.feedPosts, {as: 'Post', foreignKey: 'post_id', targetKey: 'id'});
db.feedPosts.hasMany(db.feedPostMedia);

db.feedLikes.belongsTo(db.pets, {as: 'Pet', foreignKey: 'pet_id', targetKey: 'id'});
db.pets.hasMany(db.feedLikes);

db.feedLikes.belongsTo(db.feedPosts, {as: 'Post', foreignKey: 'post_id', targetKey: 'id'});
db.feedPosts.hasMany(db.feedLikes);

db.feedComments.belongsTo(db.feedPosts, {as: 'Post', foreignKey: 'post_id', targetKey: 'id'});
db.feedPosts.hasMany(db.feedComments);

db.feedComments.belongsTo(db.pets, {as: 'Pet', foreignKey: 'pet_id', targetKey: 'id'});
db.pets.hasMany(db.feedComments);

db.feedCommentsJunction.belongsTo(db.feedComments, {as: 'ParentComment', foreignKey: 'parent_comment_id', targetKey: 'id'});
db.feedComments.hasMany(db.feedCommentsJunction);

db.feedCommentsJunction.belongsTo(db.feedComments, {as: 'ChildComment', foreignKey: 'child_comment_id', targetKey: 'id'});
db.feedComments.hasMany(db.feedCommentsJunction);

db.feedCommentLikes.belongsTo(db.feedComments, {as: 'Comment', foreignKey: 'comment_id', targetKey: 'id'});
db.feedComments.hasMany(db.feedCommentLikes);

db.feedCommentLikes.belongsTo(db.pets, {as: 'Pet', foreignKey: 'pet_id', targetKey: 'id'});
db.pets.hasMany(db.feedCommentLikes);

db.feedPosts.belongsTo(db.feedPosts, {as: 'SharedPost', foreignKey: 'shared_id', targetKey:'id'});
db.feedPosts.hasMany(db.feedPosts);

module.exports = db;
