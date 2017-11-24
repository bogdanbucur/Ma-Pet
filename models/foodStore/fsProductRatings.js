'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('fsProductRatings', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        rating: {
            type: DataTypes.FLOAT
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'fsProductRatings',
        paranoid: true,
        underscored: true
    });
};