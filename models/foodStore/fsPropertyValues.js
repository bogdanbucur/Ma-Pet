'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('fsPropertyValues', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        property_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'fsProperties',
                key: 'id'
            }
        },
        name: {
            type: DataTypes.STRING
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'fsPropertyValues',
        paranoid: true,
        underscored: true
    });
};