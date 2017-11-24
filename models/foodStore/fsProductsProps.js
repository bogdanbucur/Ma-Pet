'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('fsProductsProps', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        product_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'fsProducts',
                key: 'id'
            }
        },
        property_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'fsProperties',
                key: 'id'
            }
        },
        value_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'fsPropertyValues',
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
        tableName: 'fsProductsProps',
        paranoid: true,
        underscored: true
    });
};