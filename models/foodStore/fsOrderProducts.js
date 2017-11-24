'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('fsOrderProducts', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        order_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'fsOrders',
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
        tableName: 'fsOrderProducts',
        paranoid: true,
        underscored: true
    });
};