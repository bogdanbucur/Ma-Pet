'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('fsProducts', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.TEXT
        },
        packageType: {
            type: DataTypes.STRING
        },
        price: {
            type: DataTypes.STRING
        },
        offerPercentage: {
            type: DataTypes.FLOAT
        },
        rating: {
            type: DataTypes.FLOAT
        },
        ratingCount: {
            type: DataTypes.INTEGER
        },
        brand_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'fsBrands',
                key: 'id'
            }
        },
        category_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'fsCategories',
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
        tableName: 'fsProducts',
        paranoid: true,
        underscored: true
    });
};