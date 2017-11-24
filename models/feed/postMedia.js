'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('feedPostMedia', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        post_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'feedPosts',
                key: 'id'
            }
        },
        path: {
            type: DataTypes.STRING
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'feedPostMedia',
        paranoid: true,
        underscored: true
    });
};