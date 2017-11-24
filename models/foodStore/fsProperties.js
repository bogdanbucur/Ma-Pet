'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('fsProperties', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        category_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'fsCategories',
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
        tableName: 'fsProperties',
        paranoid: true,
        underscored: true
    });
};