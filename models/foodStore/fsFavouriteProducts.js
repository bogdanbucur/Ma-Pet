'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('fsFavouriteProducts', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        favourite: {
            type: DataTypes.BOOLEAN
        },
        user_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'user',
                key: 'id'
            }
        },
        product_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'fsProducts',
                key: 'id'
            }
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'fsFavouriteProducts',
        paranoid: true,
        underscored: true
    });
};