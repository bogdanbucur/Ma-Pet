'use strict';

module.exports = (sequelize, DataTypes) => {
    return sequelize.define('feedComments', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        pet_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'pets',
                key: 'id'
            }
        },
        post_id: {
            type: DataTypes.INTEGER,
            references: {
                model: 'feedPosts',
                key: 'id'
            }
        },
        content: {
            type: DataTypes.TEXT
        },
        parent: {
            type: DataTypes.BOOLEAN
        },
        likes: {
            type: DataTypes.INTEGER
        },
        comments: {
            type: DataTypes.ARRAY(DataTypes.JSON)
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        updated_at: DataTypes.DATE,
        deleted_at: DataTypes.DATE
    }, {
        tableName: 'feedComments',
        paranoid: true,
        underscored: true
    });
};